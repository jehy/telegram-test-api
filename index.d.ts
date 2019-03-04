declare module 'telegram-test-api' {

  interface ClientOptions {
    userId: number;
    timeout: number;
    interval: number;
    chatId: number;
    firstName: string;
    userName: string;
    type: string;
  }

  class TelegramServer {
    constructor(config?)

    getClient(botToken: string, options?: ClientOptions): TelegramClient;

    addBotMessage(message: Message, botToken): void;

    waitBotMessage(): Promise<void>;

    addUserMessage(message): void;

    messageFilter(message): boolean;

    cleanUp(): void;

    cleanUpDeamon(): void;

    /**
     * Obtains all updates (messages or any other content) sent or received by specified bot.
     * Doesn't mark updates as "read".
     * Very useful for testing `deleteMessage` Telegram API method usage.
     */
    getUpdatesHistory(token: string): any;

    start(): Promise<void>;

    removeUserMessage(updateId): void;

    removeBotMessaage(updateId): void;

    /**
     * Deletes specified message from the storage: sent by bots or by clients.
     * @returns {boolean} - `true` if the message was deleted successfully.
     */
    deleteMessage(chatId, messageId): boolean;

    close(): void;

    stop(): Promise<void>;

  }

  interface Message {
    update_id: number;
    message: {
      message_id: number,
      from: {
        id: number,
        first_name: string,
        username: string,
      },
      chat: {
        id: number,
        first_name: string,
        username: string,
        type: string,
      },
      date: number,
      text: string,
    };
  }

  class TelegramClient {
    constructor(url: string, botToken: string, options?: ClientOptions);

    /**
     * Builds new message ready for sending with `sendMessage`.
     * @param {string} messageText
     * @param {Object} options
     */
    makeMessage(messageText: string, options?): Message;

    sendMessage(message: Message): Promise<any>;

    getUpdates(): Promise<any>;

    /**
     * Obtains all updates (messages or any other content) sent or received by specified bot.
     * Doesn't mark updates as "read".
     * Very useful for testing `deleteMessage` Telegram API method usage.
     */
    getUpdatesHistory(): Promise<any>;

  }

  export = TelegramServer;
}
