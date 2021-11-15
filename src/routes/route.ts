/* eslint-disable no-unused-vars */
import { Express } from 'express';
import { TelegramServer } from '..';

export type Route = (app: Express, telegramServer: TelegramServer) => void;
