# Prompt 3: Integração com Google Calendar

## Objetivo
Criar um serviço para interagir com a API do Google Calendar, permitindo verificar disponibilidade e criar eventos, utilizando autenticação OAuth2 por profissional.

## Requisitos
-   Usar biblioteca oficial `googleapis`.
-   Autenticação via OAuth2 (cada profissional autentica sua conta).
-   Credenciais (tokens) armazenadas no banco de dados (entidade `Professional`).

## Tarefas
1.  **Instalar Dependências**:
    -   `npm install googleapis`

2.  **Configuração**:
    -   Adicionar variáveis no `.env` para OAuth client (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) -> Estas são credenciais da APLICAÇÃO.
    -   **IMPORTANTE**: Os tokens de acesso (`access_token`, `refresh_token`) e `calendarId` NÃO ficam no .env. Eles devem ser armazenados no banco de dados, na entidade `Professional`.
    -   Configurar autenticação dinâmica no serviço.

3.  **Atualizar Entidade Professional**:
    -   Adicionar campos: `google_access_token`, `google_refresh_token`, `google_token_expiry`.

4.  **Criar GoogleCalendarController** (`src/modules/scheduling/controllers/google-calendar.controller.ts`):
    -   Rota `/auth/google-calendar/auth/:professionalId`: Iniciar fluxo OAuth.
    -   Rota `/auth/google-calendar/callback`: Receber código e salvar tokens.

5.  **Criar GoogleCalendarService** (`src/modules/scheduling/services/google-calendar.service.ts`):
    -   Método `checkAvailability(professional: Professional, start: Date, end: Date)`:
        -   Usar tokens do profissional.
        -   Usar endpoint `freebusy`.
        -   Retornar intervalos livres.
    -   Método `createEvent(professional: Professional, eventData: any)`:
        -   Usar tokens do profissional.
        -   Criar evento com título, descrição, horário inicio/fim.
        -   Retornar o ID do evento criado.
    -   Método `deleteEvent(professional: Professional, eventId: string)`:
        -   Remover evento.

6.  **Tratamento de Datas**:
    -   Garantir uso correto de Timezones (UTC vs Local).

## Definição de Concluído
-   Serviço capaz de autenticar e chamar o Google Calendar API por profissional.
-   Rota de autenticação funcional.
-   Métodos de verificação de livre/ocupado funcionais.

---
**Próximo Passo**: Lógica do Fluxo de Agendamento.
