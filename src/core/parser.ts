import fs from 'fs/promises';
import path from 'path';
import parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

export class Parser {
    async parseFile(filePath: string): Promise<string[]> {
        const content = await fs.readFile(filePath, 'utf-8');
        const dependencies = new Set<string>();

        try {
            const ast = parser.parse(content, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx', 'classProperties', 'decorators-legacy'],
            });

            traverse(ast, {
                ImportDeclaration(path) {
                    dependencies.add(path.node.source.value);
                },
                CallExpression(path) {
                    if (
                        path.node.callee.type === 'Identifier' &&
                        path.node.callee.name === 'require' &&
                        path.node.arguments.length > 0 &&
                        path.node.arguments[0].type === 'StringLiteral'
                    ) {
                        dependencies.add(path.node.arguments[0].value);
                    }
                    if (path.node.callee.type === 'Import' && path.node.arguments.length > 0 && path.node.arguments[0].type === 'StringLiteral') {
                        dependencies.add(path.node.arguments[0].value);
                    }
                },
                ExportNamedDeclaration(path) {
                    if (path.node.source) {
                        dependencies.add(path.node.source.value);
                    }
                },
                ExportAllDeclaration(path) {
                    if (path.node.source) {
                        dependencies.add(path.node.source.value);
                    }
                },
            });
        } catch (error) {
            // console.warn(`Failed to parse ${filePath}:`, error);
            // Ignore parsing errors for now (e.g. syntax errors in user code)
        }

        return Array.from(dependencies);
    }
}
