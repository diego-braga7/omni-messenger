# WSL Stability Rules

- **Environment**: WSL (Windows Subsystem for Linux)
- **Constraint**: Avoid heavy concurrent operations causing connection failures.
- **Commands**:
  - Use `npm run check:dev` for linting/testing subset.
  - Use `npm run test:dev` (unit) or `npm run test:e2e:dev` (e2e) for sequential execution (`--runInBand`).
  - **AVOID**: `npm run lint && npm run test` or plain `npm test` without arguments.
  - Trust CI (GitHub Actions) for full parallel suite execution.
