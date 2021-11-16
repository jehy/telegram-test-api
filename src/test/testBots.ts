/* istanbul ignore file */

import debug from 'debug';
import TelegramBot from 'node-telegram-bot-api';

const debugServerUpdate = debug('TelegramServer:test:serverUpdate');
const debugBotMessage = debug('TelegramServer:test:botMessage');

export class Logger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static serverUpdate(...args: any[]) {
    debugServerUpdate(JSON.stringify(args));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static botMessages(...args: any[]) {
    debugBotMessage(JSON.stringify(args));
  }
}

export class TestBot {
  constructor(bot: TelegramBot) {
    bot.onText(/\/ping/, (msg) => {
      const chatId = msg.chat.id;
      if (!chatId) return;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: {
          keyboard: [[{ text: 'ok 1' }]],
        },
      };
      bot.sendMessage(chatId, 'pong', opts);
    });

    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      if (!chatId) return;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: {
          keyboard: [[{ text: 'Masha' }, { text: 'Sasha' }]],
        },
      };
      bot.sendMessage(chatId, 'What is your name?', opts);
    });

    bot.onText(/Masha/, (msg) => {
      const chatId = msg.chat.id;
      if (!chatId) return;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: {
          keyboard: [[{ text: 'Hello!' }]],
        },
      };
      bot.sendMessage(chatId, 'Hello, Masha!', opts);
    });

    bot.onText(/Sasha/, (msg) => {
      const chatId = msg.chat.id;
      if (!chatId) return;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: {
          keyboard: [[{ text: 'Hello!' }]],
        },
      };
      bot.sendMessage(chatId, 'Hello, Sasha!', opts);
    });
  }
}

export class TelegramBotEx extends TelegramBot {
  waitForReceiveUpdate() {
    return new Promise<TelegramBot.Message>((resolve) => {
      this.on('message', (msg) => {
        Logger.serverUpdate(msg);
        resolve(msg);
      });
    });
  }
}

export class CallbackQBot extends TelegramBot {
  waitForReceiveUpdate() {
    return new Promise<TelegramBot.CallbackQuery>((resolve) => {
      this.on('callback_query', (cb) => {
        Logger.serverUpdate(cb);
        resolve(cb);
      });
    });
  }
}

export class DeleterBot extends TelegramBot {
  constructor(token: string, options?: TelegramBot.ConstructorOptions) {
    super(token, options);
    this.onText(/delete/, (msg, unusedMatch) => {
      const chatId = msg.chat.id;
      this.deleteMessage(chatId, String(msg.message_id));
    });
  }
}
