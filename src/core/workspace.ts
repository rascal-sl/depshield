import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml';

export interface WorkspacePackage {
    name: string;
    path: string;
    packageJson: any;
}

export class WorkspaceManager {
    private rootPath: string;

    constructor(rootPath: string) {
        this.rootPath = rootPath;
    }

    async detectWorkspace(): Promise<'npm' | 'pnpm' | 'yarn' | null> {
        try {
            // Check for pnpm-workspace.yaml
            try {
                await fs.access(path.join(this.rootPath, 'pnpm-workspace.yaml'));
                return 'pnpm';
            } catch { }

            // Check for package.json workspaces
            const pkgJsonPath = path.join(this.rootPath, 'package.json');
            const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
            if (pkgJson.workspaces) {
                return 'npm'; // or yarn, but npm handles the workspaces key similarly for detection
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    async getPackages(): Promise<WorkspacePackage[]> {
        const type = await this.detectWorkspace();
        if (!type) {
            throw new Error('No workspace configuration found (pnpm-workspace.yaml or package.json workspaces)');
        }

        let patterns: string[] = [];

        if (type === 'pnpm') {
            const yamlContent = await fs.readFile(path.join(this.rootPath, 'pnpm-workspace.yaml'), 'utf-8');
            const doc = yaml.load(yamlContent) as any;
            if (doc && doc.packages) {
                patterns = doc.packages;
            }
        } else {
            const pkgJson = JSON.parse(await fs.readFile(path.join(this.rootPath, 'package.json'), 'utf-8'));
            patterns = Array.isArray(pkgJson.workspaces) ? pkgJson.workspaces : pkgJson.workspaces.packages || [];
        }

        const packages: WorkspacePackage[] = [];

        for (const pattern of patterns) {
            // glob patterns might match directories. We need to find package.json inside them.
            // If pattern ends with /*, glob will find directories.
            // We want to find the package.json files.
            const searchPattern = pattern.endsWith('/') ? `${pattern}package.json` : `${pattern}/package.json`;

            const matches = await glob(searchPattern, {
                cwd: this.rootPath,
                ignore: ['**/node_modules/**']
            });

            for (const match of matches) {
                const pkgPath = path.join(this.rootPath, path.dirname(match));
                const pkgJsonContent = await fs.readFile(path.join(this.rootPath, match), 'utf-8');
                try {
                    const pkgJson = JSON.parse(pkgJsonContent);
                    packages.push({
                        name: pkgJson.name || path.basename(pkgPath),
                        path: pkgPath,
                        packageJson: pkgJson
                    });
                } catch (e) {
                    // Ignore invalid package.json
                }
            }
        }

        return packages;
    }
}
