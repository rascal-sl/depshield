# API Reference

DepShield provides both a CLI and a programmatic API for analyzing dependencies.

## CLI Reference

### `scan`

Analyzes the project for unused dependencies.

```bash
depshield scan [options]
```

**Options:**

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--path` | `-p` | Path to the project root | `.` |
| `--json` | `-j` | Output results in JSON format | `false` |
| `--strict` | `-s` | Exit with code 1 if unused dependencies are found | `false` |
| `--help` | `-h` | Display help for command | |

**Examples:**

```bash
# Scan current directory
depshield scan

# Scan a specific directory
depshield scan --path ./packages/core

# Output JSON for CI/CD
depshield scan --json > report.json
```

## Configuration

DepShield can be configured using a `depshield.config.json` file in the project root.

### `DepShieldConfig` Interface

```typescript
interface DepShieldConfig {
  /**
   * Glob patterns of files to include in the scan.
   * @default ["**\/*.{js,ts,jsx,tsx,mjs,cjs}"]
   */
  include?: string[];

  /**
   * Glob patterns of files to exclude from the scan.
   * @default ["**\/node_modules/**", "**\/dist/**", "**\/coverage/**"]
   */
  exclude?: string[];

  /**
   * List of package names to ignore (never report as unused).
   * Useful for packages that are used implicitly or in non-standard ways.
   */
  ignorePackages?: string[];

  /**
   * If true, the CLI will exit with code 1 if unused dependencies are found.
   * Useful for CI/CD pipelines.
   * @default false
   */
  strictMode?: boolean;
}
```

### Default Configuration

```json
{
  "include": ["**/*.{js,ts,jsx,tsx,mjs,cjs}"],
  "exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/*.test.{js,ts}",
    "**/*.spec.{js,ts}"
  ],
  "ignorePackages": [],
  "strictMode": false
}
```

## Programmatic API

DepShield is primarily designed as a CLI tool, but internal modules can be imported if needed. Note that the internal API is subject to change.

### `analyzeDependencies(options: ScanOptions): Promise<ScanResult>`

Analyzes dependencies in the specified directory.

**Parameters:**

- `options`: Object containing scan options.
  - `path`: string - Path to project root.
  - `config`: DepShieldConfig - Configuration object.

**Returns:**

- `Promise<ScanResult>`: Result of the analysis.

```typescript
interface ScanResult {
  unusedDependencies: string[];
  usedDependencies: string[];
  missingDependencies: string[];
  stats: {
    totalFiles: number;
    scanDuration: number;
    totalSavings: number; // in bytes
  };
}
```
