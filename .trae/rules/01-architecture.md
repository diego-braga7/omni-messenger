# Architecture & NestJS Patterns

- **Dependency Injection**: Must be used for all services, repositories, and providers.
- **Module Structure**: Maintain a modular architecture (`*.module.ts`).
- **Layered Responsibility**:
  - **Controllers**: Handle HTTP request/response only. Delegate business logic to Services.
  - **Services**: Contain all business logic.
  - **DTOs**: Use Data Transfer Objects (`*.dto.ts`) with `class-validator` for strict input validation.
  - **Entities**: Use TypeORM Entities (`*.entity.ts`) for database modeling.
- **Repository Pattern**: Use repositories for data access. Extend `Repository<T>` for custom logic.
- **Messaging**: Use `RabbitmqService` for publishing; use `@MessagePattern`/`@EventPattern` for consumers.
- **Error Handling**: Use global Exception Filters or standard `HttpException` within services.
