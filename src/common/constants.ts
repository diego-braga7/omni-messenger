export const RABBITMQ_QUEUE = 'main_queue';

export const RABBITMQ_EVENTS = {
  PROCESS_MESSAGE: 'process_message',
  TEST_MESSAGE: 'test_message',
  MESSAGE_RECEIVED: 'message_received',
};

export const THROTTLER_CONFIG = {
  TTL: 60000,
  LIMIT: 10,
};

export const BULK_SEND_CONFIG = {
  BATCH_SIZE: 30,
  DELAY_MS: 10000,
};
