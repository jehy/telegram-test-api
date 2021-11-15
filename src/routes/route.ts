import { Express } from 'express';
import { TelegramServer } from '..';

// TODO move upwards

export type Route = (app: Express, telegramServer: TelegramServer) => void;
