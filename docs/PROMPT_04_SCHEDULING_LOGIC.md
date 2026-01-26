# Prompt 4: Lógica de Fluxo de Agendamento (State Machine)

## Objetivo
Implementar a inteligência do fluxo de agendamento, orquestrando a interação entre o usuário (WhatsApp/Z-API), o banco de dados (Estado) e o Google Calendar.

## Lógica do Fluxo
O fluxo deve reagir a mensagens recebidas (Webhook).

1.  **Interceptar Mensagens**:
    -   No `MessengerConsumer` ou serviço equivalente que processa mensagens recebidas.
    -   Verificar se o remetente tem um estado ativo em `ConversationState`.

2.  **Implementar SchedulingService**:
    -   Criar `handleMessage(phone: string, text: string, type: string, payload?: any)`:
        -   **Sem Estado**:
            -   Se texto contém palavras-chave (ex: "agendar", "marcar"), iniciar fluxo.
            -   Criar estado `SELECT_SERVICE`.
            -   Chamar `ZApiProvider.sendOptionList` com serviços do banco.
        -   **Estado: SELECT_SERVICE**:
            -   Validar se a resposta é um ID de serviço válido.
            -   Salvar `serviceId` no estado.
            -   Mudar estado para `SELECT_PROFESSIONAL`.
            -   Chamar `ZApiProvider.sendOptionList` com profissionais (filtrados pelo serviço se houver relação, ou todos).
        -   **Estado: SELECT_PROFESSIONAL**:
            -   Validar ID profissional.
            -   Salvar `professionalId`.
            -   Mudar estado para `SELECT_DATE`.
            -   Pedir data (texto).
        -   **Estado: SELECT_DATE**:
            -   Parsear data (usar biblioteca como `date-fns` ou simples regex). Validar se é futura.
            -   Salvar data.
            -   Consultar `GoogleCalendarService` para disponibilidade do profissional.
            -   Mudar estado para `SELECT_TIME`.
            -   Enviar lista de horários (List ou Buttons).
        -   **Estado: SELECT_TIME**:
            -   Validar horário.
            -   **Ação Final**:
                -   Criar evento no Google Calendar.
                -   Salvar `Appointment` no banco.
                -   Enviar confirmação.
                -   Limpar `ConversationState`.

3.  **Tratamento de Erros e Cancelamento**:
    -   Se usuário digitar "cancelar" a qualquer momento, limpar estado.

## Tarefas
1.  Criar `SchedulingService` com a lógica de máquina de estados.
2.  Integrar com o recebimento de mensagens (Webhook/RabbitMQ Consumer).
3.  Implementar persistência temporária no `ConversationStateRepository`.

## Definição de Concluído
-   Fluxo completo funcional: Usuário pede agendamento -> Escolhe Serviço -> Escolhe Profissional -> Escolhe Data -> Escolhe Hora -> Confirmação.
-   Dados persistidos corretamente no banco.

---
**Fim da Implementação da Funcionalidade**
