import { sendMessage } from './sendMessage';
import { sendCommand } from './sendCommand';
import { sendCallback } from './sendCallback';
import { getUpdates } from './getUpdates';
import { getUpdatesHistory } from './getUpdatesHistory';

export const clientRoutes = [
  sendMessage,
  sendCommand,
  sendCallback,
  getUpdates,
  getUpdatesHistory,
];
