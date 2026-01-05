# Omni Messenger

Projeto NestJS containerizado com PostgreSQL e RabbitMQ.

## Requisitos

- Docker
- Docker Compose

## Execução

Para iniciar todos os serviços:

```bash
docker-compose up --build
```

Para parar os serviços:

```bash
docker-compose down
```

## Arquitetura

```mermaid
graph TD
    Client[Cliente] -->|HTTP :3000| API[NestJS API]
    API -->|TypeORM| DB[(PostgreSQL)]
    API -->|AMQP :5672| MQ((RabbitMQ))
    MQ -->|Consumo| API
```

## Serviços

- **app**: API NestJS (Porta 3000)
- **postgres**: Banco de dados (Porta interna 5432)
- **rabbitmq**: Mensageria (Porta 5672 AMQP, 15672 Management)

## Endpoints Principais

A documentação interativa via Swagger está disponível em:
`http://localhost:3000/api`

### Mensagens
- **POST /messenger/text**: Envio de mensagem de texto.
- **POST /messenger/document**: Envio de documento.
- **POST /messenger/bulk-send**: Envio em massa com rate limiting (30 msgs/10s).
- **GET /messenger/history**: Histórico de mensagens.

### Usuários
- **POST /users**: Criação de usuário.
- **GET /users**: Listagem de usuários.
- **GET /users/:id**: Detalhes do usuário.
- **PUT /users/:id**: Atualização de usuário.
- **DELETE /users/:id**: Remoção lógica (soft delete).

Para detalhes sobre a arquitetura do módulo de mensagens (Z-API, Factory Pattern, SOLID), consulte:
[Documentação do Módulo Messenger](docs/MESSENGER_MODULE.md)

## Testes

Executar testes unitários:
```bash
npm run test
```

Executar testes E2E:
```bash
npm run test:e2e
```

## Detalhes de Implementação

### Envio em Massa (Bulk Send)
O endpoint `/messenger/bulk-send` implementa um mecanismo de controle de taxa (rate limiting) na camada de aplicação:
- **Lotes**: As mensagens são divididas em grupos de 30.
- **Intervalo**: Há um atraso de 10 segundos entre o processamento de cada lote.
- **Monitoramento**: Logs detalhados são gerados para cada lote e mensagem processada.
- **Resiliência**: Falhas no enfileiramento de uma mensagem não interrompem o processamento do lote.

### Retry Policy (RabbitMQ)
Atualmente, o consumidor processa a mensagem e, em caso de falha na API externa (Z-API):
1. O erro é capturado e logado.
2. O status da mensagem no banco de dados é atualizado para `FAILED`.
3. A mensagem é removida da fila (ACK) para evitar loops infinitos.
*Para ambientes de produção, recomenda-se a configuração de Dead Letter Exchanges (DLX) para retentativas com backoff exponencial.*

## Desenvolvimento

O projeto utiliza:
- NestJS (Framework)
- TypeORM (ORM)
- RabbitMQ (Mensageria)
- Docker (Containerização)

A configuração de conexão com o banco de dados e RabbitMQ é feita via variáveis de ambiente no `docker-compose.yml`.
