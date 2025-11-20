import fs from 'fs/promises';
import path from 'path';
import { walkFiles } from '../utils/file-walker.js';
import { loadConfig } from '../config/loader.js';
import { ConfigOptions } from '../config/types.js';

export interface PackageJson {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
}

export interface ScanOptions {
    path: string;
    config?: ConfigOptions;
}

export class Scanner {
    private rootPath: string;
    private config?: ConfigOptions;

    constructor(options: ScanOptions) {
        this.rootPath = path.resolve(options.path);
        this.config = options.config;
    }

    async readPackageJson(): Promise<PackageJson> {
        const packageJsonPath = path.join(this.rootPath, 'package.json');
        try {
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            return JSON.parse(content) as PackageJson;
        } catch (error) {
            throw new Error(`Could not read package.json at ${packageJsonPath}`);
        }
    }

    async getSourceFiles(): Promise<string[]> {
        const config = this.config || await loadConfig(this.rootPath);
        return walkFiles({
            path: this.rootPath,
            include: config.include,
            exclude: config.exclude,
        });
    }

    async getConfig(): Promise<ConfigOptions> {
        if (!this.config) {
            this.config = await loadConfig(this.rootPath);
        }
        return this.config;
    }
}
