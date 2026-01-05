# Módulo Messenger - Documentação Técnica

Este documento detalha a arquitetura e implementação do módulo de envio de mensagens do Omni Messenger.

## Visão Geral

O módulo `Messenger` é responsável por gerenciar o envio de mensagens (texto e documentos) para diferentes canais. Atualmente, a integração principal é com a **Z-API** (WhatsApp), mas a arquitetura foi desenhada para permitir fácil extensão para outros gateways (ex: Telegram, Twilio).

## Arquitetura e Padrões de Projeto (SOLID)

O módulo foi construído seguindo rigorosamente os princípios SOLID para garantir manutenibilidade e extensibilidade.

### 1. Dependency Inversion Principle (DIP) & Open/Closed Principle (OCP)
Utilizamos o padrão **Factory / Strategy** através do sistema de injeção de dependência do NestJS.

- **Interface Abstrata (`IMessengerProvider`)**: Define o contrato que qualquer provedor de mensagens deve seguir.
  - `sendText(...)`
  - `sendDocument(...)`
- **Implementação Concreta (`ZApiProvider`)**: Implementa a lógica específica da Z-API.
- **Injeção Transparente**: O `MessengerController` depende apenas de `IMessengerProvider` (injeção por token `MESSENGER_PROVIDER`), desconhecendo a implementação concreta.

Isso permite que, para trocar o provedor (ex: mudar de Z-API para Telegram), baste criar uma nova classe `TelegramProvider` implementando a interface e alterar a configuração no `MessengerModule`, sem tocar em nenhuma linha do Controller.

### 2. Single Responsibility Principle (SRP)
Cada classe tem uma responsabilidade única:
- `MessengerController`: Recebe requisições HTTP e valida DTOs.
- `ZApiProvider`: Comunica-se com a API externa.
- `SendTextDto` / `SendDocumentDto`: Definem a estrutura dos dados.

## Endpoints (API REST)

A documentação interativa (Swagger) está disponível em `/api` quando a aplicação está rodando.

### Enviar Texto
**POST** `/messenger/text`

Body:
```json
{
  "phone": "5511999999999",
  "message": "Olá, mundo!",
  "delayMessage": 1,
  "delayTyping": 1,
  "modelId": "uuid-do-modelo-opcional"
}
```

*Nota: Se `modelId` for fornecido, a mensagem será validada contra o tipo do modelo (deve ser TEXT).*

### Enviar Documento
**POST** `/messenger/document`

Body:
```json
{
  "phone": "5511999999999",
  "document": "https://example.com/file.pdf",
  "fileName": "meu-arquivo",
  "extension": "pdf",
  "caption": "Segue anexo",
  "modelId": "uuid-do-modelo-opcional"
}
```

*Nota: Se `modelId` for fornecido, a mensagem será validada contra o tipo do modelo (deve ser DOCUMENT).*

## Funcionalidades Adicionais

### Gestão Automática de Usuários
Ao enviar uma mensagem para um número de telefone (`phone`), o sistema verifica automaticamente se existe um usuário com este número. Se não existir, um novo registro de usuário é criado na tabela `users` e vinculado à mensagem.

### Validação de Modelos
O sistema agora suporta a vinculação de mensagens a modelos pré-definidos (`modelId`). Se um ID de modelo for enviado:
1. O sistema verifica se o modelo existe.
2. O sistema valida se o tipo do modelo corresponde ao tipo de envio (TEXT ou DOCUMENT).
3. Retorna erro 400 (Bad Request) em caso de inconsistência.

## Configuração (Variáveis de Ambiente)

Para que o `ZApiProvider` funcione, configure as seguintes variáveis no `.env` ou `docker-compose.yml`:

```env
ZAPI_INSTANCE_ID=sua_instancia
ZAPI_TOKEN=seu_token
ZAPI_CLIENT_TOKEN=seu_client_token
```

## Testes

O módulo possui testes unitários com mocks para garantir o isolamento.

```bash
npm run test
```

Os testes validam:
- Se o Controller chama os métodos corretos do Provider.
- Se o Provider constrói as requisições HTTP corretamente para a Z-API.
