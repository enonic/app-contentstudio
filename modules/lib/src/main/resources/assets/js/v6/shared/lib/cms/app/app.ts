import { $config } from '../../../config/config.store';

export const getAppName = (): string => $config.get().appId;
