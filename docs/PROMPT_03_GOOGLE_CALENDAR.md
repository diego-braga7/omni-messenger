# Prompt 3: Integração com Google Calendar

## Objetivo
Criar um serviço para interagir com a API do Google Calendar, permitindo verificar disponibilidade e criar eventos.

## Requisitos
-   Usar biblioteca oficial `googleapis` (verificar se já está instalada, senão adicionar).
-   Autenticação via Service Account (arquivo JSON de credenciais ou variáveis de ambiente).

## Tarefas
1.  **Instalar Dependências**:
    -   `npm install googleapis`

2.  **Configuração**:
    -   Adicionar variáveis no `.env` (ex: `GOOGLE_PROJECT_ID`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CLIENT_EMAIL`).
    -   Configurar autenticação no construtor do serviço.

3.  **Criar GoogleCalendarService** (`src/modules/scheduling/services/google-calendar.service.ts`):
    -   Método `checkAvailability(calendarId: string, start: Date, end: Date)`:
        -   Usar endpoint `freebusy`.
        -   Retornar intervalos livres.
    -   Método `createEvent(calendarId: string, eventData: any)`:
        -   Criar evento com título, descrição, horário inicio/fim.
        -   Retornar o ID do evento criado.
    -   Método `deleteEvent(calendarId: string, eventId: string)`:
        -   Remover evento.

4.  **Tratamento de Datas**:
    -   Garantir uso correto de Timezones (UTC vs Local). O projeto parece usar timestamp, cuidado com conversões.

## Definição de Concluído
-   Serviço capaz de autenticar e chamar o Google Calendar API.
-   Métodos de verificação de livre/ocupado funcionais.

---
**Próximo Passo**: Lógica do Fluxo de Agendamento.
