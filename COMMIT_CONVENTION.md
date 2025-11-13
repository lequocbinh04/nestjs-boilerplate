# Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification enforced by commitlint.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type

Must be one of the following:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring (neither fixes a bug nor adds a feature)
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **build**: Build system or external dependencies changes
- **ci**: CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Revert a previous commit

## Scope (Optional)

The scope should be the name of the affected module/feature:

- auth
- users
- email
- database
- redis
- etc.

## Subject

- Use sentence case (capitalize first letter)
- No period at the end
- Max 100 characters for header
- Describe what the commit does, not what issue it fixes

## Examples

### Good Commits

```
feat(auth): Add email verification flow
fix(users): Resolve password hashing issue
docs: Update API documentation
style: Format code with Biome
refactor(auth): Simplify token validation logic
perf(database): Optimize user query with indexes
test(auth): Add integration tests for login
build: Update dependencies
ci: Add Biome check to GitHub Actions
chore: Update gitignore
```

### Bad Commits

```
❌ added new feature
❌ Fix bug
❌ updated stuff
❌ WIP
❌ fixed tests.
```

## Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api)!: Remove deprecated endpoints

BREAKING CHANGE: The /api/v1/old-endpoint has been removed. Use /api/v2/new-endpoint instead.
```

## Auto-validation

Commit messages are automatically validated by commitlint on `git commit`. Invalid commits will be rejected with helpful error messages.
