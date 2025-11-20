import { PackageJson } from './scanner.js';
import { ConfigOptions } from '../config/types.js';

export interface UnusedDependency {
    name: string;
    version: string;
    size?: number;
    type: 'production' | 'dev';
}

export interface AnalysisResult {
    unusedDependencies: UnusedDependency[];
    unusedDevDependencies: UnusedDependency[];
    missingDependencies: string[];
    usedDependencies: string[];
    totalSavings: number;
}

export class Analyzer {
    private config?: ConfigOptions;

    constructor(config?: ConfigOptions) {
        this.config = config;
    }

    analyze(packageJson: PackageJson, usedDependencies: Set<string>, sizeMap?: Map<string, number>): AnalysisResult {
        const installedDeps = Object.keys(packageJson.dependencies || {});
        const installedDevDeps = Object.keys(packageJson.devDependencies || {});

        const unusedDependencies: UnusedDependency[] = [];
        const unusedDevDependencies: UnusedDependency[] = [];
        const missingDependencies: string[] = [];
        let totalSavings = 0;

        // Check if package should be ignored
        const isIgnored = (dep: string): boolean => {
            if (!this.config?.ignorePackages?.length) return false;
            return this.config.ignorePackages.some(pattern => {
                if (pattern.includes('*')) {
                    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                    return regex.test(dep);
                }
                return dep === pattern;
            });
        };

        // Helper to check if a dependency is used (handling subpaths like 'lodash/fp')
        const isUsed = (dep: string) => {
            if (usedDependencies.has(dep)) return true;
            for (const used of usedDependencies) {
                if (used.startsWith(`${dep}/`)) return true;
                if (dep.startsWith('@') && used.startsWith(dep)) return true; // Handle scoped packages
            }
            return false;
        };

        // Check production dependencies
        for (const dep of installedDeps) {
            if (isIgnored(dep)) continue;

            if (!isUsed(dep)) {
                // Special case: @types packages are usually dev deps but sometimes in deps
                if (!dep.startsWith('@types/')) {
                    const size = sizeMap?.get(dep) || 0;
                    totalSavings += size;
                    unusedDependencies.push({
                        name: dep,
                        version: packageJson.dependencies![dep],
                        size,
                        type: 'production',
                    });
                }
            }
        }

        // Check dev dependencies
        const ignoredDevDeps = ['typescript', 'eslint', 'prettier', 'jest', 'ts-jest', 'husky', 'lint-staged', 'vitest'];

        for (const dep of installedDevDeps) {
            if (isIgnored(dep)) continue;

            if (!isUsed(dep) && !dep.startsWith('@types/') && !ignoredDevDeps.includes(dep) && !dep.includes('plugin') && !dep.includes('config')) {
                const size = sizeMap?.get(dep) || 0;
                totalSavings += size;
                unusedDevDependencies.push({
                    name: dep,
                    version: packageJson.devDependencies![dep],
                    size,
                    type: 'dev',
                });
            }
        }

        return {
            unusedDependencies,
            unusedDevDependencies,
            missingDependencies,
            usedDependencies: Array.from(usedDependencies),
            totalSavings,
        };
    }
}
