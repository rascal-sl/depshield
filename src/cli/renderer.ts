import chalk from 'chalk';
import { AnalysisResult } from '../core/analyzer.js';
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
        console.log(chalk.gray('  Run: npm uninstall <package-name>'));
        console.log();
    }
}
