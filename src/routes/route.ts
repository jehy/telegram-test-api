/* eslint-disable no-unused-vars */
import { Express } from 'express';
import { TelegramServer } from '../telegramServer';

export type Route = (app: Express, telegramServer: TelegramServer) => void;
