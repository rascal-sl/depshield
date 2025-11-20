# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-21

### Added
- **Security Audit**: New `depshield audit` command to check for vulnerabilities using `npm audit`.
- **Monorepo Support**: New `--workspace` flag to scan all packages in npm/pnpm workspaces.
- **GitHub Action**: Official composite action for easy CI/CD integration.
- **Combined Scan**: `depshield scan --audit` to run both dependency analysis and security checks.

## [1.0.2] - 2025-11-21

### Added
- Initial public release of DepShield CLI
- Smart dependency analysis using AST parsing
- Support for JavaScript and TypeScript projects
- Detection of unused dependencies
- Package size analysis and potential savings calculation
- Configurable inclusion/exclusion patterns via `depshield.config.json`
- JSON output support for CI/CD integration
- Comprehensive documentation and examples
