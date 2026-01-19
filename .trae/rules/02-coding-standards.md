# Coding Standards & Clean Code

## Standards
- **Naming Conventions**:
  - Files: `kebab-case` (e.g., `user.controller.ts`)
  - Classes: `PascalCase` (e.g., `UserController`)
  - Variables/Methods: `camelCase` (e.g., `createUser`)
  - Interfaces: `PascalCase` (no 'I' prefix unless conflicting).
- **Imports**: Organize: NestJS core -> Third party -> Local modules.
- **Logging**: Use NestJS `Logger` instead of `console.log`.

## Quality & Clean Code
- **No Magic Numbers**: Avoid hardcoded numeric/string literals. Use constants (`*.constants.ts`) or Enums.
- **Descriptive Naming**: Variable/function names must clearly describe intent.
- **Small Functions**: Do one thing well.
- **DRY**: Extract common logic.
- **Comments**: Explain "why", not "what".

## SOLID
- **S**: Single Responsibility
- **O**: Open/Closed
- **L**: Liskov Substitution
- **I**: Interface Segregation
- **D**: Dependency Inversion
