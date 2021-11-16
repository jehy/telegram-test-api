import request from 'axios';
import merge from 'deep-extend';
import pTimeout from 'p-timeout';
import type { Chat, MessageEntity, User } from 'typegram';
import { promisify } from 'util';
import type { GetUpdatesResponse } from '../routes/client/getUpdates';
import type { GetUpdatesHistoryResponse } from '../routes/client/getUpdatesHistory';

export interface CommonMessage {
  from: User;
  chat: Chat;
}

export interface MessageMeta {
  date: number;
  botToken: string;
}

export interface CallbackQueryRequest extends MessageMeta {
  message: CommonMessage;
  from: User;
  data: string;
}
export interface MessageRequest extends CommonMessage, MessageMeta {
  text: string;
}
export interface CommandRequest extends MessageRequest, MessageMeta {
  text: string;
  entities: MessageEntity[];
}

export interface CommonResponse {
  ok: true;
  result: null;
}
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export interface ClientOptions {
  /** @default 1 */
  userId: number;
  /** maximum time `getUpdates` polls for updates @default 1000 */
  timeout: number;
  /** polling interval for `getUpdates` method @default 100 */
  interval: number;
  /** `Message.chat.id` option @default 1 */
  chatId: number;
  /** `Message.chat.first_name` option @default 'Test Name' */
  firstName: string;
  /** `Message.chat.user_name` option @default TestName */
  userName: string;
  /** `Message.chat` option @default private */
  type: 'private' | 'group' | 'supergroup' | 'channel';
  /** @default 'Test Name' */
  chatTitle: string;
}

const delay = promisify(setTimeout);
/**
 *
 * @param url API url
 * @param botToken bot which needs to receive your message
 * @constructor
 */
export class TelegramClient {
  private userId: number;

  private timeout: number;

  private interval: number;

  private chatId: number;

  private firstName: string;

  private userName: string;

  private chatTitle: string;

  private url: string;

  private botToken: string;

  private type: 'private' | 'group' | 'supergroup' | 'channel';

  constructor(
    url: string,
    botToken: string,
    options: Partial<ClientOptions> = {},
  ) {
    this.userId = options.userId || 1;
    this.timeout = options.timeout || 1000;
    this.interval = options.interval || 100;
    this.chatId = options.chatId || 1;
    this.chatTitle = options.chatTitle || options.firstName || 'Test Name';
    this.firstName = options.firstName || 'TestName';
    this.userName = options.userName || 'testUserName';
    this.type = options.type || 'private';
    if (url === undefined) {
      throw new Error('Please define telegram api URL');
    }
    if (botToken === undefined) {
      throw new Error('Please define bot token');
    }
    this.url = url;
    this.botToken = botToken;
  }

  /**
   * Builds new message ready for sending with `sendMessage`.
   */
  makeMessage(messageText: string, options: DeepPartial<MessageRequest> = {}) {
    return merge(
      {
        ...this.makeCommonMessage(),
        ...this.getMessageMeta(),
        text: messageText,
      },
      options,
    );
  }

  makeCommand(messageText: string, options: DeepPartial<CommandRequest> = {}) {
    const entityOffset = (messageText.includes('/') && messageText.indexOf('/')) || 0;
    const entityLength = (messageText.includes(' ') && messageText.indexOf(' ') - entityOffset)
      || messageText.length;

    const entities = [
      {
        offset: entityOffset,
        length: entityLength,
        type: 'bot_command' as const,
      },
    ];

    return merge(
      {
        ...this.makeCommonMessage(),
        ...this.getMessageMeta(),
        text: messageText,
        entities,
      },
      options,
    );
  }

  makeCallbackQuery(
    data: string,
    options: DeepPartial<CallbackQueryRequest> = {},
  ) {
    const message = this.makeCommonMessage();
    return merge(
      {
        ...this.getMessageMeta(),
        from: message.from,
        message,
        data,
      },
      options,
    );
  }

  private makeCommonMessage() {
    return {
      from: {
        id: this.userId,
        first_name: this.firstName,
        username: this.userName,
        is_bot: false,
      },
      chat: {
        id: this.chatId,
        title: this.chatTitle,
        first_name: this.firstName,
        username: this.userName,
        type: this.type,
      },
    };
  }

  private getMessageMeta() {
    return {
      botToken: this.botToken,
      date: Math.floor(Date.now() / 1000),
    };
  }

  async sendMessage(message: MessageRequest): Promise<CommonResponse> {
    const res = await request({
      url: `${this.url}/sendMessage`,
      method: 'POST',
      data: message,
    });
    return res && res.data;
  }

  async sendCommand(message: CommandRequest): Promise<CommonResponse> {
    const res = await request({
      url: `${this.url}/sendCommand`,
      method: 'POST',
      data: message,
    });
    return res && res.data;
  }

  async sendCallback(message: CallbackQueryRequest): Promise<CommonResponse> {
    const res = await request({
      url: `${this.url}/sendCallback`,
      method: 'POST',
      data: message,
    });
    return res && res.data;
  }

  async getUpdates(): Promise<GetUpdatesResponse> {
    const data = { token: this.botToken };
    const update = await request({
      url: `${this.url}/getUpdates`,
      method: 'POST',
      data,
    });
    if (
      update.data
      && update.data.result !== undefined
      && update.data.result.length >= 1
    ) {
      return update.data;
    }
    await delay(this.interval);
    return pTimeout(
      this.getUpdates(),
      this.timeout,
      `did not get new updates in ${this.timeout} ms`,
    );
  }

  /**
   * Obtains all updates (messages or any other content) sent or received by specified bot.
   * Doesn't mark updates as "read".
   * Very useful for testing `deleteMessage` Telegram API method usage.
   */
  async getUpdatesHistory(): Promise<GetUpdatesHistoryResponse['result']> {
    const data = { token: this.botToken };
    const res = await request({
      url: `${this.url}/getUpdatesHistory`,
      method: 'POST',
      data,
    });
    return res.data && res.data.result;
  }
}
