🔧 Prompt de Desenvolvimento (Atualizado com Rotas da Z-API e Migrações)

Seguir Padrões do Projeto: Antes de iniciar, leia os arquivos em .trae/rules para entender as diretrizes de codificação e estruturação. Mantenha consistência com o estilo, arquitetura e organização existentes.

Fluxo de Agendamento WhatsApp: Desenvolva a funcionalidade de agendamento completo via WhatsApp:

Etapa 1 – Mensagem inicial e seleção de serviço

Ação: Ao receber uma mensagem de um número de telefone ainda sem agendamento ativo, inicie o fluxo de agendamento.

Z-API: Enviar uma lista de opções de serviços com POST /send-option-list.

Formato: Enviar lista de serviços cadastrados no banco (servicos) com IDs no campo id da Z-API.

Webhook esperado: Receber listResponseMessage.selectedRowId com ID do serviço selecionado.

Persistência: Armazenar a seleção do serviço no estado da conversa (temporariamente ou em banco).

Resposta: Após seleção, iniciar etapa de escolha de profissional.

Etapa 2 – Seleção de profissional

Z-API: Enviar lista de profissionais com POST /send-option-list.

Critério: Listar todos ou apenas os que oferecem o serviço selecionado.

Webhook esperado: listResponseMessage.selectedRowId com ID do profissional.

Persistência: Armazenar profissional_id para o agendamento.

Resposta: Pedir data desejada.

Etapa 3 – Entrada de data (texto)

Z-API: Enviar pergunta com POST /send-text, instruindo o usuário a informar a data em linguagem natural.

Webhook esperado: message.text.body com texto do cliente.

Tratamento: Interpretar datas como “hoje”, “amanhã”, “25/01”, etc.

Persistência: Armazenar a data em formato YYYY-MM-DD no contexto.

Etapa 4 – Listagem de horários disponíveis

Integração externa: Consultar disponibilidade via Google Calendar usando POST /freeBusy.

Lógica: Calcular intervalos livres com base nos eventos ocupados e duração do serviço.

Z-API: Enviar horários disponíveis com:

POST /send-option-list (se até 10 horários) ou

POST /send-button-actions (se até 3 horários).

Webhook esperado: listResponseMessage.selectedRowId ou buttonsResponseMessage.buttonId.

Persistência: Armazenar data e hora selecionadas.

Etapa 5 – Confirmação e agendamento

Integração externa: Criar evento via POST /calendars/{calendarId}/events (Google Calendar).

Z-API: Enviar mensagem de confirmação com POST /send-text.

Persistência: Criar registro em agendamentos com dados do usuário, profissional, serviço, data/hora e google_event_id.

Etapa 6 – Cancelamento ou Remarcação

Z-API: Detectar mensagem de cliente com agendamento ativo (verificar no banco).

Z-API: Enviar botões com POST /send-button-actions:

Botões: “Remarcar” (id: reschedule), “Cancelar” (id: cancel)

Webhook esperado: buttonsResponseMessage.buttonId.

Lógica:

Se “Cancelar”: deletar evento do Google Calendar com DELETE /calendars/{calendarId}/events/{eventId} e atualizar status no banco.

Se “Remarcar”: repetir Etapas 3, 4 e 5 com atualização via PATCH /events/{eventId}.

Z-API: Enviar mensagem de confirmação de cancelamento ou remarcação com POST /send-text.

## 📦 Modelagem de Dados (TypeORM Entities)

O projeto utiliza **TypeORM** com **PostgreSQL**. As tabelas devem seguir o padrão de nomenclatura em inglês (`snake_case` no banco, `camelCase` no código) e usar **UUID** como chave primária.

### 1. User (`users`) - Já existente
*Reutilizar a entidade existente `src/modules/users/entities/user.entity.ts`.*
- **id**: UUID (PK)
- **name**: varchar
- **phone**: varchar (Unique)
- **email**: varchar
- **created_at**: timestamp

### 2. Professional (`professionals`)
- **id**: UUID (PK)
- **name**: varchar
- **specialty**: varchar
- **calendar_id**: varchar (ID do Google Calendar)
- **created_at**: timestamp
- **updated_at**: timestamp

### 3. Service (`services`)
- **id**: UUID (PK)
- **name**: varchar
- **description**: text
- **duration_minutes**: integer
- **created_at**: timestamp
- **updated_at**: timestamp

### 4. Appointment (`appointments`)
- **id**: UUID (PK)
- **user_id**: UUID (FK -> users.id)
- **professional_id**: UUID (FK -> professionals.id)
- **service_id**: UUID (FK -> services.id)
- **start_time**: timestamp
- **end_time**: timestamp
- **status**: enum ('SCHEDULED', 'CANCELED', 'COMPLETED', 'RESCHEDULED')
- **google_event_id**: varchar
- **created_at**: timestamp
- **updated_at**: timestamp

### 5. ConversationState (`conversation_states`)
*Tabela para gerenciar o estado da conversa do usuário no fluxo do WhatsApp.*
- **phone**: varchar (PK)
- **step**: enum/varchar (ex: 'SELECT_SERVICE', 'SELECT_DATE')
- **data**: jsonb (armazena seleções temporárias)
- **updated_at**: timestamp

---

## ✅ Boas Práticas Adicionais

- **Migrations**: Criar migrations via TypeORM para todas as alterações de esquema.
- **Seeds**: Criar seeds para popular serviços e profissionais iniciais.
- **DTOs**: Validar todas as entradas (Webhooks e APIs) com `class-validator`.
- **Testes**: Cobrir o fluxo com testes unitários (Services) e de integração.