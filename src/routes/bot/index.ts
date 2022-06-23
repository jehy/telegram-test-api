import { deleteMessage } from './deleteMessage';
import { getUpdates } from './getUpdates';
import { getMe } from './getMe';
import { answerCallbackQuery } from './answerCallbackQuery';
import { sendMessage } from './sendMessage';
import { editMessageText } from './editMessageText';
import { editMessageReplyMarkup } from './editMessageReplyMarkup';
import { setWebhook } from './setWebhook';
import { deleteWebhook } from './deleteWebhook';
import { unknownMethod } from './unknownMethod';

export const botRoutes = [
  deleteMessage,
  getUpdates,
  answerCallbackQuery,
  getMe,
  editMessageText,
  editMessageReplyMarkup,
  sendMessage,
  setWebhook,
  deleteWebhook,
  unknownMethod, // This route should go after all bot API methods.
];
