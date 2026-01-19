# Testing & Workflow

## Testing
- **Unit Tests**: Co-located with source (`.spec.ts`). Mock all external dependencies.
- **E2E Tests**: Located in `test/` directory.

## Workflow
1. Analyze problem.
2. Create/Update DTOs & Entities.
3. Implement Service logic.
4. Expose via Controller.
5. Add Tests.
6. Verify Docker build.
