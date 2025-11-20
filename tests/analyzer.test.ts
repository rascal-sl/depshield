import { Analyzer } from '../src/core/analyzer';
import { PackageJson } from '../src/core/scanner';

describe('Analyzer', () => {
    const mockPackageJson: PackageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
            'react': '^18.0.0',
            'lodash': '^4.17.21',
            'axios': '^1.0.0'
        },
        devDependencies: {
            'typescript': '^5.0.0',
            'jest': '^29.0.0',
            '@types/react': '^18.0.0',
            'unused-dev-dep': '^1.0.0'
        }
    };

    it('should correctly identify unused dependencies', () => {
        const analyzer = new Analyzer();
        const usedDependencies = new Set(['react']);

        const result = analyzer.analyze(mockPackageJson, usedDependencies);

        expect(result.unusedDependencies).toHaveLength(2);
        expect(result.unusedDependencies.map(d => d.name)).toContain('lodash');
        expect(result.unusedDependencies.map(d => d.name)).toContain('axios');
        expect(result.unusedDependencies.map(d => d.name)).not.toContain('react');
    });

    it('should correctly identify unused devDependencies', () => {
        const analyzer = new Analyzer();
        const usedDependencies = new Set(['react']);

        const result = analyzer.analyze(mockPackageJson, usedDependencies);

        // typescript, jest, @types/react should be ignored by default logic or type check
        // unused-dev-dep should be flagged
        expect(result.unusedDevDependencies.map(d => d.name)).toContain('unused-dev-dep');
        expect(result.unusedDevDependencies.map(d => d.name)).not.toContain('typescript');
        expect(result.unusedDevDependencies.map(d => d.name)).not.toContain('jest');
    });

    it('should respect ignorePackages config', () => {
        const config = {
            ignorePackages: ['lodash']
        };
        const analyzer = new Analyzer(config);
        const usedDependencies = new Set(['react']);

        const result = analyzer.analyze(mockPackageJson, usedDependencies);

        expect(result.unusedDependencies.map(d => d.name)).not.toContain('lodash');
        expect(result.unusedDependencies.map(d => d.name)).toContain('axios');
    });

    it('should handle subpath imports', () => {
        const analyzer = new Analyzer();
        const usedDependencies = new Set(['lodash/fp']);

        const result = analyzer.analyze(mockPackageJson, usedDependencies);

        expect(result.unusedDependencies.map(d => d.name)).not.toContain('lodash');
    });

    it('should calculate total savings', () => {
        const analyzer = new Analyzer();
        const usedDependencies = new Set(['react']);
        const sizeMap = new Map([
            ['lodash', 1000],
            ['axios', 500],
            ['unused-dev-dep', 200]
        ]);

        const result = analyzer.analyze(mockPackageJson, usedDependencies, sizeMap);

        expect(result.totalSavings).toBe(1700);
    });
});
