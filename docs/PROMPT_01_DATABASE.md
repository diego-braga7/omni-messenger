# Prompt 1: Implementação do Banco de Dados para Agendamento

## Objetivo
Criar as entidades e migrações necessárias para suportar o sistema de agendamento, seguindo o padrão TypeORM e Naming Convention do projeto (nomes em inglês, UUIDs, snake_case no banco).

## Contexto Atual
- O sistema já possui a tabela `users` (Entidade `User`).
- O sistema usa TypeORM com migrações manuais em `src/database/migrations`.
- As entidades ficam em `src/modules/*/entities/`.

## Tarefas
1.  **Criar Módulo de Agendamento**:
    -   Criar estrutura `src/modules/scheduling/`.
    -   Criar `scheduling.module.ts`.

2.  **Criar Entidades** (em `src/modules/scheduling/entities/`):
    -   **Professional (`professionals`)**:
        -   `id` (UUID, PK)
        -   `name` (varchar)
        -   `specialty` (varchar)
        -   `calendar_id` (varchar, ID do Google Calendar)
        -   `created_at`, `updated_at`
    -   **Service (`services`)**:
        -   `id` (UUID, PK)
        -   `name` (varchar)
        -   `description` (text, nullable)
        -   `duration_minutes` (int)
        -   `price` (decimal, nullable - opcional, mas bom ter)
        -   `created_at`, `updated_at`
    -   **Appointment (`appointments`)**:
        -   `id` (UUID, PK)
        -   `user_id` (UUID, FK -> users.id)
        -   `professional_id` (UUID, FK -> professionals.id)
        -   `service_id` (UUID, FK -> services.id)
        -   `start_time` (timestamp)
        -   `end_time` (timestamp)
        -   `status` (enum: SCHEDULED, CANCELED, COMPLETED)
        -   `google_event_id` (varchar, nullable)
        -   `created_at`, `updated_at`
    -   **ConversationState (`conversation_states`)**:
        -   `phone` (varchar, PK ou Unique Index - para rastrear o estado do usuário no WhatsApp)
        -   `step` (enum/varchar - ex: 'SELECT_SERVICE', 'SELECT_PROFESSIONAL', 'SELECT_DATE', 'SELECT_TIME')
        -   `data` (jsonb - para armazenar seleções temporárias como serviceId, professionalId, date)
        -   `updated_at`

3.  **Criar Migrations**:
    -   Gerar uma migration para criar todas as tabelas acima e configurar as chaves estrangeiras (Foreign Keys).
    -   Assegurar que os nomes das tabelas e colunas estejam em snake_case (ex: `user_id`, `created_at`).

4.  **Atualizar Entidade User**:
    -   Adicionar relação `OneToMany` com `Appointment` em `src/modules/users/entities/user.entity.ts`.

## Definição de Concluído
-   Arquivos de entidade criados (`.entity.ts`).
-   Arquivo de migration criado e executável.
-   Módulo `SchedulingModule` registrado no `AppModule` (se necessário).
-   `npm run typeorm:run` executa com sucesso.

---
**Próximo Passo**: Implementar extensão do Z-API Provider.
