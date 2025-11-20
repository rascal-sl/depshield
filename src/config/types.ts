export interface ConfigOptions {
    include?: string[];
    exclude?: string[];
    ignorePackages?: string[];
    strictMode?: boolean;
    entryPoints?: string[];
}

export const DEFAULT_CONFIG: ConfigOptions = {
    include: ['**/*.{js,ts,jsx,tsx,mjs,cjs}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    ignorePackages: [],
    strictMode: false,
    entryPoints: [],
};
