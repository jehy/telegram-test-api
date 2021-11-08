'use strict';

const Debug = require('debug');

const debugServerUpdate = Debug('TelegramServer:test:serverUpdate');
const debugBotMessage = Debug('TelegramServer:test:botMessage');
const TelegramBot = require('node-telegram-bot-api');

class Logger {
  static serverUpdate(...args) {
    debugServerUpdate(JSON.stringify(args));
  }

  static botMessages(...args) {
    debugBotMessage(JSON.stringify(args));
  }
}

class TestBot {
  constructor(bot) {
    bot.onText(/\/ping/, (msg) => {
      const chatId = msg.from.id;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'ok 1'}]],
        }),
      };
      bot.sendMessage(chatId, 'pong', opts);
    });

    bot.onText(/\/start/, (msg) => {
      const chatId = msg.from.id;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'Masha'}, {text: 'Sasha'}]],
        }),
      };
      bot.sendMessage(chatId, 'What is your name?', opts);
    });

    bot.onText(/Masha/, (msg) => {
      const chatId = msg.from.id;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'Hello!'}]],
        }),
      };
      bot.sendMessage(chatId, 'Hello, Masha!', opts);
    });

    bot.onText(/Sasha/, (msg) => {
      const chatId = msg.from.id;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'Hello!'}]],
        }),
      };
      bot.sendMessage(chatId, 'Hello, Sasha!', opts);
    });
  }
}

class TelegramBotEx extends TelegramBot {
  waitForReceiveUpdate() {
    return new Promise((resolve) => {
      this.on('message', (msg) => {
        Logger.serverUpdate(msg);
        resolve(msg);
      });
    });
  }
}

class CallbackQBot extends TelegramBot {
  waitForReceiveUpdate() {
    return new Promise((resolve) => {
      this.on('callback_query', (cb) => {
        Logger.serverUpdate(cb);
        resolve(cb);
      });
    });
  }
}

class DeleterBot extends TelegramBot {
  constructor(...args) {
    super(...args);
    this.onText(/delete/, (msg, unusedMatch) => {
      const chatId = msg.chat.id;
      this.deleteMessage(chatId, msg.message_id);
    });
  }
}

module.exports = {
  DeleterBot, CallbackQBot, TelegramBotEx, TestBot, Logger,
};
