/* eslint-disable no-unused-vars */
import type { Express } from 'express';
import type { TelegramServer } from '../telegramServer';

export type Route = (app: Express, telegramServer: TelegramServer) => void;
