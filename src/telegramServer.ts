import assert from 'assert';
import request from 'axios';
import debugTest from 'debug';
import EventEmitter from 'events';
import express, { Express } from 'express';
import http from 'http';
import shutdown from 'http-shutdown';
import { MessageEntity, Params } from 'typegram';
import { requestLogger } from './modules/requestLogger';
import { sendResult } from './modules/sendResult';
import {
  CallbackQueryRequest,
  ClientOptions,
  CommandRequest,
  MessageRequest,
  TelegramClient,
} from './modules/telegramClient';
import { routes } from './routes/index';

const debugServer = debugTest('TelegramServer:server');
const debugStorage = debugTest('TelegramServer:storage');

interface WebHook {
  url: string;
}
type Server = ReturnType<typeof shutdown>;

interface StoredUpdate {
  time: number;
  botToken: string;
  updateId: number;
  messageId: number;
  isRead: boolean;
}

// TODO instead of `any` here must be `InputFile` whatever that is
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BotIncommingMessage = Params<'sendMessage', any>[0] & {
  // TODO parse reply_markup to its actual type, see https://git.io/J1kiM
  reply_markup?: string;
};
export interface StoredBotUpdate extends StoredUpdate {
  message: BotIncommingMessage;
}

interface StoredMessageUpdate extends StoredUpdate {
  message: MessageRequest;
}
interface StoredCommandUpdate extends StoredUpdate {
  message: CommandRequest;
  entities: MessageEntity[];
}
interface StoredCallbackQueryUpdate extends StoredUpdate {
  callbackQuery: CallbackQueryRequest;
  callbackId: number;
}
export type StoredClientUpdate =
  | StoredMessageUpdate
  | StoredCommandUpdate
  | StoredCallbackQueryUpdate;

interface Storage {
  userMessages: StoredClientUpdate[];
  botMessages: StoredBotUpdate[];
}

export interface TelegramServerConfig {
  /** @default 9000 */
  port: number;
  /** @default localhost */
  host: string;
  /** @default http */
  protocol: 'http' | 'https';
  /** where you want to store messages. Right now, only RAM option is implemented. */
  storage: 'RAM' | string;
  /**
   * how many seconds you want to store user and bot messages which were not fetched by bot or client.
   * @default 60
   */
  storeTimeout: number;
}

export class TelegramServer extends EventEmitter {
  private webServer: Express;

  private started = false;

  private updateId = 1;

  private messageId = 1;

  private callbackId = 1;

  public config: TelegramServerConfig & { apiURL: string };

  public storage: Storage = {
    userMessages: [],
    botMessages: [],
  };

  // eslint-disable-next-line no-undef
  private cleanUpDaemonInterval: NodeJS.Timer | null = null;

  private server: Server | null = null;

  private webhooks: Record<string, WebHook> = {};

  constructor(config: Partial<TelegramServerConfig> = {}) {
    super();
    this.config = TelegramServer.normalizeConfig(config);
    debugServer(`Telegram API server config: ${JSON.stringify(this.config)}`);

    this.webServer = express();
    this.webServer.use(sendResult);
    this.webServer.use(express.json());
    this.webServer.use(express.urlencoded({ extended: true }));
    this.webServer.use(requestLogger);

    if (this.config.storage === 'RAM') {
      this.storage = {
        userMessages: [],
        botMessages: [],
      };
    }
    for (let i = 0; i < routes.length; i++) {
      routes[i](this.webServer, this);
    }
    // there was no route to process request
    this.webServer.use((req, res) => {
      res.sendError(new Error('Route not found'));
    });
    // Catch express bodyParser error, like http://stackoverflow.com/questions/15819337/catch-express-bodyparser-error
    // TODO check if signature with `error` first actually still works
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.webServer.use((error, req, res: any) => {
      debugServer(`Error: ${error}`);
      res.sendError(new Error(`Something went wrong. ${error}`));
    });
  }

  static normalizeConfig(config: Partial<TelegramServerConfig>) {
    const appConfig = {
      port: config.port || 9000,
      host: config.host || 'localhost',
      protocol: config.protocol || 'http',
      storage: config.storage || 'RAM',
      storeTimeout: (config.storeTimeout || 60) * 1000, // store for a minute by default
      apiURL: '',
    };
    appConfig.apiURL = `${appConfig.protocol}://${appConfig.host}:${appConfig.port}`;
    return appConfig;
  }

  getClient(botToken: string, options?: Partial<ClientOptions>) {
    return new TelegramClient(this.config.apiURL, botToken, options);
  }

  addBotMessage(message: BotIncommingMessage, botToken: string) {
    const d = new Date();
    const millis = d.getTime();
    const add = {
      time: millis,
      botToken,
      message,
      updateId: this.updateId,
      messageId: this.messageId,
      isRead: false,
    };
    this.storage.botMessages.push(add);
    this.messageId++;
    this.updateId++;
    this.emit('AddedBotMessage');
  }

  async waitBotMessage() {
    return new Promise<void>((resolve) => {
      this.on('AddedBotMessage', () => resolve());
    });
  }

  async waitUserMessage() {
    return new Promise<void>((resolve) => {
      this.on('AddedUserMessage', () => resolve());
      this.on('AddedUserCommand', () => resolve());
      this.on('AddedUserCallbackQuery', () => resolve());
    });
  }

  async addUserMessage(message: MessageRequest) {
    await this.addUserUpdate({
      ...this.getCommonFields(message.botToken),
      message,
    });
    this.messageId++;
    this.emit('AddedUserMessage');
  }

  async addUserCommand(message: CommandRequest) {
    assert.ok(message.entities, 'Command should have entities');

    await this.addUserUpdate({
      ...this.getCommonFields(message.botToken),
      message,
      entities: message.entities,
    });
    this.messageId++;
    this.emit('AddedUserCommand');
  }

  async addUserCallback(callbackQuery: CallbackQueryRequest) {
    await this.addUserUpdate({
      ...this.getCommonFields(callbackQuery.botToken),
      callbackQuery,
      callbackId: this.callbackId,
    });
    this.callbackId++;
    this.emit('AddedUserCallbackQuery');
  }

  private getCommonFields(botToken: string) {
    const d = new Date();
    const millis = d.getTime();
    return {
      time: millis,
      botToken,
      updateId: this.updateId,
      messageId: this.messageId,
      isRead: false,
    };
  }

  private async addUserUpdate(update: StoredClientUpdate) {
    assert.ok(
      update.botToken,
      'The message must be of type object and must contain `botToken` field.',
    );
    const webhook = this.webhooks[update.botToken];
    if (webhook) {
      const resp = await request({
        url: webhook.url,
        method: 'POST',
        data: this.formatUpdate(update),
      });
      if (resp.status > 204) {
        debugServer(
          `Webhook invocation failed: ${JSON.stringify({
            url: webhook.url,
            method: 'POST',
            requestBody: update,
            responseStatus: resp.status,
            responseBody: resp.data,
          })}`,
        );
        throw new Error('Webhook invocation failed');
      }
    } else {
      this.storage.userMessages.push(update);
    }
    this.updateId++;
  }

  messageFilter(message: StoredUpdate) {
    const d = new Date();
    const millis = d.getTime();
    return message.time > millis - this.config.storeTimeout;
  }

  cleanUp() {
    debugStorage('clearing storage');
    debugStorage(
      `current userMessages storage: ${this.storage.userMessages.length}`,
    );
    this.storage.userMessages = this.storage.userMessages.filter(
      this.messageFilter,
      this,
    );
    debugStorage(
      `filtered userMessages storage: ${this.storage.userMessages.length}`,
    );
    debugStorage(
      `current botMessages storage: ${this.storage.botMessages.length}`,
    );
    this.storage.botMessages = this.storage.botMessages.filter(
      this.messageFilter,
      this,
    );
    debugStorage(
      `filtered botMessages storage: ${this.storage.botMessages.length}`,
    );
  }

  cleanUpDaemon() {
    if (!this.started) {
      return;
    }
    this.cleanUpDaemonInterval = setInterval(
      this.cleanUp.bind(this),
      this.config.storeTimeout,
    );
  }

  /**
   * Obtains all updates (messages or any other content) sent or received by specified bot.
   * Doesn't mark updates as "read".
   * Very useful for testing `deleteMessage` Telegram API method usage.
   */
  getUpdatesHistory(token: string) {
    return [...this.storage.botMessages, ...this.storage.userMessages]
      .filter((item) => item.botToken === token)
      .sort((a, b) => a.time - b.time);
  }

  getUpdates(token: string) {
    const messages = this.storage.userMessages.filter(
      (update) => update.botToken === token && !update.isRead,
    );
    // turn messages into updates
    return messages.map((update) => {
      // eslint-disable-next-line no-param-reassign
      update.isRead = true;
      return this.formatUpdate(update);
    });
  }

  async start() {
    this.server = shutdown(http.createServer(this.webServer));
    await new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.server!.listen(this.config.port, this.config.host)
        .once('listening', resolve)
        .once('error', reject);
    });
    debugServer(
      `Telegram API server is up on port ${this.config.port} in ${this.webServer.settings.env} mode`,
    );
    this.started = true;
    this.cleanUpDaemon();
  }

  removeUserMessage(updateId: number) {
    this.storage.userMessages = this.storage.userMessages.filter(
      (update) => update.updateId !== updateId,
    );
  }

  removeBotMessage(updateId: number) {
    this.storage.botMessages = this.storage.botMessages.filter(
      (update) => update.updateId !== updateId,
    );
  }

  setWebhook(webhook: WebHook, botToken: string) {
    this.webhooks[botToken] = webhook;
    debugServer(`Webhook for bot ${botToken} set to: ${webhook.url}`);
  }

  deleteWebhook(botToken: string) {
    delete this.webhooks[botToken];
    debugServer(`Webhook unset for bot ${botToken}`);
  }

  /**
   * Deletes specified message from the storage: sent by bots or by clients.
   * @returns `true` if the message was deleted successfully.
   */
  deleteMessage(chatId: number, messageId: number) {
    const isMessageToDelete = (
      update: StoredClientUpdate | StoredBotUpdate,
    ) => {
      let messageChatId: number;
      if ('callbackQuery' in update) {
        messageChatId = update.callbackQuery.message.chat.id;
      } else if ('chat' in update.message) {
        messageChatId = update.message.chat.id;
      } else {
        messageChatId = Number(update.message.chat_id);
      }
      return messageChatId === chatId && update.messageId === messageId;
    };
    const userUpdate = this.storage.userMessages.find(isMessageToDelete);

    if (userUpdate) {
      this.removeUserMessage(userUpdate.updateId);
      return true;
    }

    const botUpdate = this.storage.botMessages.find(isMessageToDelete);

    if (botUpdate) {
      this.removeBotMessage(botUpdate.updateId);
      return true;
    }

    return false;
  }

  async stop() {
    if (this.server === undefined) {
      debugServer('Cant stop server - it is not running!');
      return false;
    }
    this.started = false;
    if (this.cleanUpDaemonInterval) {
      clearInterval(this.cleanUpDaemonInterval);
    }

    const expressStop = new Promise<void>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.server!.shutdown(() => {
        resolve();
      });
    });
    debugServer('Stopping server...');
    this.storage = {
      userMessages: [],
      botMessages: [],
    };
    await expressStop;
    debugServer('Server shutdown ok');
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  private formatUpdate(update: StoredClientUpdate) {
    if ('callbackQuery' in update) {
      return {
        update_id: update.updateId,
        callback_query: {
          id: String(update.callbackId),
          from: update.callbackQuery.from,
          message: update.callbackQuery.message,
          data: update.callbackQuery.data,
        },
      };
    }
    return {
      update_id: update.updateId,
      message: {
        message_id: update.messageId,
        from: update.message.from,
        chat: update.message.chat,
        date: update.message.date,
        text: update.message.text,
        ...('entities' in update ? { entities: update.entities } : {}),
      },
    };
  }
}
