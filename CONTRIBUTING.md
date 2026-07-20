# Contributing to AirMarket AI

Thank you for your interest in contributing to AirMarket AI! This guide outlines our coding standards, branch strategy, commit conventions, and review procedures to ensure code quality.

---

## 🛠️ Branch Strategy

We follow the **Git Flow** branching pattern:
- **`main`**: Production-ready branch. Must remain stable and compilable at all times.
- **`dev`**: Integration branch for new features and updates.
- **Feature Branches (`feat/...`)**: Used for developing new features. Must be branched from and merged back into `dev`.
- **Bug Fix Branches (`fix/...`)**: Used for fixing issues.

---

## 📝 Commit Conventions

We enforce **Conventional Commits**. Please format your commit messages as follows:

```
<type>(<scope>): <description>

[optional body]
```

### Types:
- `feat`: A new feature.
- `fix`: A bug fix.
- `docs`: Documentation updates.
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.

### Examples:
- `feat(knn): restrict competitor search limits to 1.5km`
- `fix(etl): solve sqlite database lock conflicts in daily run`

---

## 📐 Code Style Guidelines

- **Python**: Follow PEP 8 coding guidelines. Use type hints for all public functions and class methods.
- **Javascript**: Use standard ES6 syntax, react functional components with hooks, and avoid mixing inline styles with stylesheet tokens.

---

## 🧪 Pull Request & Test Verification

Before submitting a Pull Request:
1. Run linting checks and code formatting.
2. Confirm the frontend compiles successfully using:
   ```bash
   npm run build
   ```
3. Execute backend tests locally and verify SQL queries and database migration scripts pass.
