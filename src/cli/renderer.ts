import chalk from 'chalk';
import { AnalysisResult } from '../core/analyzer.js';
import { AuditResult, Vulnerability } from '../core/auditor.js';
import { PackageJson } from '../core/scanner.js';
import { formatBytes } from '../utils/package-size.js';

export interface RenderOptions {
    json?: boolean;
}

export class Renderer {
    renderResults(
        result: AnalysisResult,
        packageJson: PackageJson,
        fileCount: number,
        duration: number,
        options: RenderOptions = {}
    ): void {
        if (options.json) {
            this.renderJson(result, packageJson, fileCount, duration);
            return;
        }

        this.renderConsole(result, packageJson, fileCount, duration);
    }

    private renderJson(
        result: AnalysisResult,
        packageJson: PackageJson,
        fileCount: number,
        duration: number
    ): void {
        const output = {
            projectName: packageJson.name,
            version: packageJson.version,
            scanDate: new Date().toISOString(),
            duration,
            summary: {
                totalFiles: fileCount,
                totalDependencies: Object.keys(packageJson.dependencies || {}).length,
                totalDevDependencies: Object.keys(packageJson.devDependencies || {}).length,
                unusedDependencies: result.unusedDependencies.length,
                unusedDevDependencies: result.unusedDevDependencies.length,
                potentialSavings: {
                    bytes: result.totalSavings,
                    formatted: formatBytes(result.totalSavings),
                },
            },
            unusedDependencies: result.unusedDependencies,
            unusedDevDependencies: result.unusedDevDependencies,
        };

        console.log(JSON.stringify(output, null, 2));
    }

    private renderConsole(
        result: AnalysisResult,
        packageJson: PackageJson,
        fileCount: number,
        duration: number
    ): void {
        const durationSec = (duration / 1000).toFixed(1);

        console.log(chalk.green(`\n✓ Analyzed ${fileCount} files in ${durationSec}s`));

        const totalUnused = result.unusedDependencies.length + result.unusedDevDependencies.length;

        if (totalUnused === 0) {
            console.log(chalk.green('\n🎉 No unused dependencies found! Your project is clean.'));
            return;
        }

        // Production Dependencies
        if (result.unusedDependencies.length > 0) {
            console.log(chalk.bold(`\n📦 Unused Dependencies (${result.unusedDependencies.length} found):`));
            result.unusedDependencies.forEach(dep => {
                const sizeInfo = dep.size ? chalk.gray(` (${formatBytes(dep.size)})`) : '';
                console.log(chalk.red(`  • ${dep.name}`) + sizeInfo + chalk.gray(' - Not imported anywhere'));
            });
        }

        // Dev Dependencies
        if (result.unusedDevDependencies.length > 0) {
            console.log(chalk.bold(`\n🔧 Unused DevDependencies (${result.unusedDevDependencies.length} found):`));
            result.unusedDevDependencies.forEach(dep => {
                const sizeInfo = dep.size ? chalk.gray(` (${formatBytes(dep.size)})`) : '';
                console.log(chalk.yellow(`  • ${dep.name}`) + sizeInfo + chalk.gray(' - Dev dependency (safe to remove)'));
            });
        }

        // Savings Summary
        if (result.totalSavings > 0) {
            console.log(chalk.bold(`\n💰 Potential Savings: ${formatBytes(result.totalSavings)}`));
        }

        // Recommendation
        console.log(chalk.bold('\n💡 Recommendation:'));
        console.log(chalk.gray('  Review the unused dependencies above and remove them if not needed.'));
        console.log(chalk.dim('  Run: npm uninstall <package-name>'));
        console.log();
    }

    renderAudit(result: AuditResult): void {
        console.log('\n' + chalk.bold.underline('🛡️  Security Audit Report') + '\n');

        if (result.vulnerabilities.length === 0) {
            console.log(chalk.green('  ✔ No known vulnerabilities found!'));
            return;
        }

        const { metadata } = result;
        console.log(chalk.bold('Summary:'));
        console.log(`  Total Vulnerabilities: ${chalk.bold(metadata.vulnerabilities.total)}`);

        if (metadata.vulnerabilities.critical > 0) console.log(chalk.red.bold(`  Critical: ${metadata.vulnerabilities.critical}`));
        if (metadata.vulnerabilities.high > 0) console.log(chalk.red(`  High: ${metadata.vulnerabilities.high}`));
        if (metadata.vulnerabilities.moderate > 0) console.log(chalk.yellow(`  Moderate: ${metadata.vulnerabilities.moderate}`));
        if (metadata.vulnerabilities.low > 0) console.log(chalk.blue(`  Low: ${metadata.vulnerabilities.low}`));

        console.log('\n' + chalk.bold('Details:'));

        result.vulnerabilities.forEach((vuln) => {
            const severityColor = this.getSeverityColor(vuln.severity);
            console.log(chalk.dim('---------------------------------------------------'));
            console.log(`${severityColor(vuln.severity.toUpperCase())} - ${chalk.bold(vuln.packageName)}`);
            console.log(`  Title: ${vuln.title}`);
            console.log(`  Vulnerable: ${vuln.vulnerableVersions}`);
            if (vuln.url) console.log(`  More Info: ${chalk.blue.underline(vuln.url)}`);
        });

        console.log(chalk.dim('---------------------------------------------------'));
        console.log(chalk.yellow('\n⚠️  Recommendation: Run `npm audit fix` to resolve automatically where possible.'));
    }

    private getSeverityColor(severity: string) {
        switch (severity) {
            case 'critical': return chalk.red.bold;
            case 'high': return chalk.red;
            case 'moderate': return chalk.yellow;
            case 'low': return chalk.blue;
            default: return chalk.white;
        }
    }
}
