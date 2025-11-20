# Contributing to DepShield

First off, thank you for considering contributing to DepShield! It's people like you that make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

## 🤝 How Can You Contribute?

### 🐛 Reporting Bugs

This section guides you through submitting a bug report for DepShield. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as many details as possible.
- **Provide specific examples** to demonstrate the steps. Include copy/pasteable snippets.
- **Describe the behavior you observed** after following the steps and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead** and why.
- **Include screenshots and animated GIFs** which show you following the reproduction steps.

### ✨ Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for DepShield, including completely new features and minor improvements to existing functionality.

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
- **Provide specific examples** to demonstrate the steps.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why.

### 📝 Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## 💻 Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rascal-sl/depshield.git
   cd depshield-cli
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the project**
   ```bash
   pnpm build
   ```

4. **Run tests**
   ```bash
   pnpm test
   ```

5. **Link for local testing**
   ```bash
   pnpm link --global
   ```

## 🎨 Code Style

- We use **TypeScript** for type safety.
- We use **ESLint** and **Prettier** for code formatting.
- Please run `pnpm lint` and `pnpm format` before committing.

## 🏷️ Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

## ❓ Questions?

Feel free to ask questions in [GitHub Discussions](https://github.com/rascal-sl/depshield/discussions).
