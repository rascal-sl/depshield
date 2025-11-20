import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
    .name('depshield')
    .description('Smart Dependency Analyzer & Optimizer')
    .version('1.0.0');

program
    .command('scan')
    .description('Scan the current project for unused dependencies')
    .option('-p, --path <path>', 'Path to project directory', '.')
    .option('--json', 'Output results in JSON format')
    .action(async (options) => {
        const startTime = Date.now();
        console.log(chalk.blue('🛡️  DepShield: Starting scan...'));
        console.log(chalk.gray(`Scanning path: ${options.path}\n`));

        try {
            const { Scanner } = await import('./core/scanner.js');
            const { Parser } = await import('./core/parser.js');
            const { Analyzer } = await import('./core/analyzer.js');
            const { Renderer } = await import('./cli/renderer.js');
            const { getPackageSizes } = await import('./utils/package-size.js');
            const ora = (await import('ora')).default;

            const spinner = ora('Reading package.json...').start();
            const scanner = new Scanner({ path: options.path });
            const packageJson = await scanner.readPackageJson();
            const config = await scanner.getConfig();
            spinner.succeed(`Read package.json (${packageJson.name}@${packageJson.version})`);

            spinner.start('Finding source files...');
            const files = await scanner.getSourceFiles();
            spinner.succeed(`Found ${files.length} source files`);

            spinner.start('Parsing files...');
            const parser = new Parser();
            const usedDependencies = new Set<string>();

            for (const file of files) {
                const deps = await parser.parseFile(file);
                deps.forEach(d => usedDependencies.add(d));
            }
            spinner.succeed(`Parsed files. Found ${usedDependencies.size} unique imports.`);

            spinner.start('Analyzing dependencies...');
            const analyzer = new Analyzer(config);
            const prelimResult = analyzer.analyze(packageJson, usedDependencies);

            // Fetch package sizes for unused dependencies
            const unusedPackages = [
                ...prelimResult.unusedDependencies,
                ...prelimResult.unusedDevDependencies,
            ];

            let sizeMap = new Map<string, number>();
            if (unusedPackages.length > 0) {
                spinner.text = 'Fetching package sizes...';
                const packagesToFetch = unusedPackages.map(dep => ({
                    name: dep.name,
                    version: dep.version.replace(/^[^0-9]*/, ''), // Remove ^ or ~ prefix
                }));

                const sizes = await getPackageSizes(packagesToFetch);
                sizes.forEach((info, name) => {
                    sizeMap.set(name, info.size);
                });
            }

            // Re-analyze with sizes
            const result = analyzer.analyze(packageJson, usedDependencies, sizeMap);
            spinner.succeed('Analysis complete.');

            const duration = Date.now() - startTime;
            const renderer = new Renderer();
            renderer.renderResults(result, packageJson, files.length, duration, { json: options.json });

            // Exit codes
            if (config.strictMode && (result.unusedDependencies.length > 0 || result.unusedDevDependencies.length > 0)) {
                process.exit(1);
            }

        } catch (error: any) {
            console.error(chalk.red('\n❌ Error during scan:'), error.message);
            process.exit(1);
        }
    });

program.parse();
