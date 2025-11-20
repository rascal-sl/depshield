import { exec } from 'child_process';
import { promisify } from 'util';
import ora from 'ora';
import chalk from 'chalk';

const execAsync = promisify(exec);

export interface Vulnerability {
    id: string;
    title: string;
    severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
    packageName: string;
    version: string;
    vulnerableVersions: string;
    patchedVersions: string;
    url: string;
}

export interface AuditResult {
    vulnerabilities: Vulnerability[];
    metadata: {
        vulnerabilities: {
            info: number;
            low: number;
            moderate: number;
            high: number;
            critical: number;
            total: number;
        };
        dependencies: number;
        devDependencies: number;
        optionalDependencies: number;
        totalDependencies: number;
    };
}

export class Auditor {
    private packageManager: 'npm' | 'pnpm' | 'yarn';

    constructor(packageManager: 'npm' | 'pnpm' | 'yarn' = 'npm') {
        this.packageManager = packageManager;
    }

    async audit(cwd: string = process.cwd()): Promise<AuditResult> {
        const spinner = ora('Running security audit...').start();

        try {
            // We use --json to get machine-readable output
            // We ignore the exit code because npm audit returns non-zero if vulnerabilities are found
            const command = this.getAuditCommand();
            const { stdout } = await execAsync(command, { cwd, maxBuffer: 10 * 1024 * 1024 }).catch(e => e);

            // npm audit sometimes outputs JSON mixed with other text if there are errors, 
            // but usually --json forces clean output. 
            // However, if the command failed completely (e.g. no package.json), we should throw.
            if (!stdout) {
                throw new Error('No output from audit command');
            }

            const result = this.parseAuditOutput(stdout);
            spinner.succeed('Security audit complete');
            return result;
        } catch (error: any) {
            spinner.fail('Security audit failed');
            throw new Error(`Failed to run audit: ${error.message}`);
        }
    }

    private getAuditCommand(): string {
        switch (this.packageManager) {
            case 'pnpm':
                return 'pnpm audit --json';
            case 'yarn':
                return 'yarn audit --json'; // Yarn v1
            default:
                return 'npm audit --json';
        }
    }

    private parseAuditOutput(jsonOutput: string): AuditResult {
        try {
            const data = JSON.parse(jsonOutput);

            // Handle npm audit v7+ format
            if (data.vulnerabilities) {
                const vulns: Vulnerability[] = [];

                // npm audit --json output structure varies slightly between versions.
                // This handles the standard v7+ structure where vulnerabilities is an object keyed by package name
                // or a flat object in newer versions.

                // Let's assume standard npm v7+ structure where 'vulnerabilities' is an object
                Object.values(data.vulnerabilities).forEach((vuln: any) => {
                    // Some versions wrap individual issues in 'via' array
                    if (vuln.via && Array.isArray(vuln.via)) {
                        vuln.via.forEach((issue: any) => {
                            if (typeof issue === 'object') {
                                vulns.push({
                                    id: issue.source || 'N/A',
                                    title: issue.title,
                                    severity: issue.severity,
                                    packageName: issue.name,
                                    version: issue.range, // This is often the vulnerable range
                                    vulnerableVersions: issue.range,
                                    patchedVersions: 'See report', // npm json doesn't always give this cleanly in 'via'
                                    url: issue.url
                                });
                            }
                        });
                    } else if (vuln.name) {
                        // Direct format
                        vulns.push({
                            id: 'N/A',
                            title: vuln.title || 'Security Vulnerability',
                            severity: vuln.severity,
                            packageName: vuln.name,
                            version: vuln.range,
                            vulnerableVersions: vuln.range,
                            patchedVersions: 'N/A',
                            url: vuln.url || ''
                        });
                    }
                });

                return {
                    vulnerabilities: vulns,
                    metadata: data.metadata || {
                        vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
                        dependencies: 0,
                        devDependencies: 0,
                        optionalDependencies: 0,
                        totalDependencies: 0
                    }
                };
            }

            return {
                vulnerabilities: [],
                metadata: {
                    vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
                    dependencies: 0,
                    devDependencies: 0,
                    optionalDependencies: 0,
                    totalDependencies: 0
                }
            };

        } catch (error) {
            throw new Error('Failed to parse audit JSON output');
        }
    }
}
