# Prompt 2: Extensão do Z-API Provider

## Objetivo
Atualizar o `ZApiProvider` para suportar o envio de Listas de Opções e Botões, necessários para o fluxo interativo de agendamento.

## Contexto Atual
-   O serviço `ZApiProvider` (`src/modules/messenger/providers/z-api/z-api.service.ts`) já implementa `sendText` e `sendDocument`.
-   Interface `IMessengerProvider` define o contrato.

## Referências Z-API
-   **Send Option List**: `POST /send-option-list`
    -   Payload típico: `{ phone, message, title, footer, buttonLabel, optionList: { title, rows: [{ id, title, description }] } }`
-   **Send Button Actions**: `POST /send-button-actions` (ou `send-button-list` dependendo da versão, verificar compatibilidade com API oficial do WhatsApp via Z-API).
    -   Payload típico: `{ phone, message, title, footer, buttonList: [{ id, label }] }`

## Tarefas
1.  **Atualizar Interface**:
    -   Adicionar métodos `sendOptionList` e `sendButtonActions` (ou nomes similares) em `IMessengerProvider` (`src/modules/messenger/interfaces/messenger.interface.ts`).
    -   Definir interfaces para os parâmetros (DTOs) para garantir tipagem forte.

2.  **Implementar no ZApiProvider**:
    -   Implementar `sendOptionList`:
        -   Montar a URL e payload corretos.
        -   Adicionar logs e tratamento de erro (try/catch com logger).
    -   Implementar `sendButtonActions` (Botões de resposta rápida/Call to Action):
        -   Montar a URL e payload.
        -   Tratamento de erro.

3.  **Testes Unitários**:
    -   Atualizar `z-api.service.spec.ts` para testar os novos métodos (mockando o `HttpService`).

## Definição de Concluído
-   `ZApiProvider` possui métodos para enviar listas e botões.
-   Compilação sem erros (`npm run build`).
-   Testes unitários passando.

---
**Próximo Passo**: Integração com Google Calendar.
