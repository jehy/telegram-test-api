import { clientRoutes } from './client/index';
import { botRoutes } from './bot/index';

export const routes = [...clientRoutes, ...botRoutes];
