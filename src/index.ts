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
    .option('-p, --path <path>', 'Path to project root', process.cwd())
    .option('-j, --json', 'Output results in JSON format')
    .option('-w, --workspace', 'Scan all packages in a monorepo workspace')
    .option('--audit', 'Run security audit alongside dependency scan')
    .action(async (options) => {
        const startTime = Date.now();
        console.log(chalk.blue('🛡️  DepShield: Starting scan...'));
        console.log(chalk.gray(`Scanning path: ${options.path}\n`));

        try {
            // Static imports for core modules
            const { Scanner } = await import('./core/scanner.js');
            const { Parser } = await import('./core/parser.js');
            const { Analyzer } = await import('./core/analyzer.js');
            const { Renderer } = await import('./cli/renderer.js');
            const { Auditor } = await import('./core/auditor.js');
            const { WorkspaceManager } = await import('./core/workspace.js');
            const { getPackageSizes } = await import('./utils/package-size.js');
            const ora = (await import('ora')).default;

            const renderer = new Renderer();

            if (options.workspace) {
                const workspaceManager = new WorkspaceManager(options.path);
                const packages = await workspaceManager.getPackages();

                if (packages.length === 0) {
                    const spinner = ora('Scanning workspace...').start();
                    spinner.fail('No workspace packages found.');
                    process.exit(1);
                }

                console.log(chalk.green(`✔ Found ${packages.length} workspace packages.`));

                let hasIssues = false;
                const rootScanner = new Scanner({ path: options.path });
                const rootConfig = await rootScanner.getConfig();

                for (const pkg of packages) {
                    console.log(chalk.bold(`\n📦 Scanning workspace package: ${chalk.cyan(pkg.name)}`));

                    const pkgScanner = new Scanner({ path: pkg.path });
                    const pkgSpinner = ora(`Analyzing ${pkg.name}...`).start();

                    try {
                        const packageJson = await pkgScanner.readPackageJson();
                        const pkgConfig = await pkgScanner.getConfig();
                        const files = await pkgScanner.getSourceFiles();

                        if (files.length === 0) {
                            pkgSpinner.warn(`No source files found in ${pkg.name}. Skipping.`);
                            continue;
                        }

                        const parser = new Parser();
                        const usedDependencies = new Set<string>();
                        for (const file of files) {
                            const deps = await parser.parseFile(file);
                            deps.forEach(d => usedDependencies.add(d));
                        }

                        const sizeMap = new Map<string, number>();

                        const pkgAnalyzer = new Analyzer(pkgConfig);
                        const analysisResult = pkgAnalyzer.analyze(packageJson, usedDependencies, sizeMap);
                        pkgSpinner.succeed(`Analyzed ${pkg.name}`);

                        renderer.renderResults(analysisResult, packageJson, files.length, 0, { json: options.json });

                        if (analysisResult.unusedDependencies.length > 0 || analysisResult.missingDependencies.length > 0) {
                            hasIssues = true;
                        }
                    } catch (err: any) {
                        pkgSpinner.fail(`Failed to scan ${pkg.name}: ${err.message}`);
                    }
                }

                if (rootConfig.strictMode && hasIssues) {
                    process.exit(1);
                }

            } else {
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
                        version: dep.version.replace(/^[^0-9]*/, ''),
                    }));

                    const sizes = await getPackageSizes(packagesToFetch);
                    sizes.forEach((info, name) => {
                        sizeMap.set(name, info.size);
                    });
                }

                const analysisResult = analyzer.analyze(packageJson, usedDependencies, sizeMap);
                spinner.succeed('Analysis complete.');

                const duration = Date.now() - startTime;
                renderer.renderResults(analysisResult, packageJson, files.length, duration, { json: options.json });

                if (config.strictMode && (analysisResult.unusedDependencies.length > 0 || analysisResult.missingDependencies.length > 0)) {
                    process.exit(1);
                }
            }

            if (options.audit) {
                const auditor = new Auditor();
                console.log(chalk.bold('\n🛡️  Running Security Audit...'));
                const auditResult = await auditor.audit(options.path);

                if (options.json) {
                    console.error(chalk.yellow('Note: Audit results are not yet included in JSON output for `scan --audit`. Use `depshield audit` for dedicated JSON report.'));
                } else {
                    renderer.renderAudit(auditResult);
                }
            }

        } catch (error: any) {
            console.error(chalk.red('\n❌ Error during scan:'), error.message);
            process.exit(1);
        }
    });

program
    .command('audit')
    .description('Run security vulnerability audit')
    .option('-p, --path <path>', 'Path to project root', process.cwd())
    .option('-j, --json', 'Output results in JSON format')
    .action(async (options) => {
        try {
            const { Auditor } = await import('./core/auditor.js');
            const { Renderer } = await import('./cli/renderer.js');
            const ora = (await import('ora')).default;

            const spinner = ora('Running security audit...').start();
            const auditor = new Auditor();
            const renderer = new Renderer();

            const result = await auditor.audit(options.path);
            spinner.succeed('Security audit complete.');

            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
            } else {
                renderer.renderAudit(result);
            }
        } catch (error: any) {
            console.error(chalk.red(`\n❌ Error during audit: ${error.message}`));
            process.exit(1);
        }
    });

program.parse();
