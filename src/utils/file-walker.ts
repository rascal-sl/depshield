import { glob } from 'glob';
import path from 'path';

export interface FileWalkerOptions {
    path: string;
    include?: string[];
    exclude?: string[];
    ignorePackages?: string[];
}

export async function walkFiles(options: FileWalkerOptions): Promise<string[]> {
    const { path: rootPath, include = ['**/*.{js,ts,jsx,tsx,mjs,cjs}'], exclude = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'] } = options;

    const files = await glob(include, {
        cwd: rootPath,
        ignore: exclude,
        absolute: true,
        nodir: true,
    });

    return files;
}
