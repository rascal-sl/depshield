import fs from 'fs/promises';
import path from 'path';
import { ConfigOptions, DEFAULT_CONFIG } from './types.js';

export async function loadConfig(projectPath: string): Promise<ConfigOptions> {
    const configPath = path.join(projectPath, 'depshield.config.json');

    try {
        const content = await fs.readFile(configPath, 'utf-8');
        const userConfig = JSON.parse(content) as Partial<ConfigOptions>;

        return {
            ...DEFAULT_CONFIG,
            ...userConfig,
        };
    } catch {
        // Config file doesn't exist or is invalid, use defaults
        return DEFAULT_CONFIG;
    }
}
