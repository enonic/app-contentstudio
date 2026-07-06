import { getAppName } from '../cms/app/app';

export const DETAILS_WIDGET_NAME = 'details';

export const getDetailsWidgetKey = (): string => `${getAppName()}:${DETAILS_WIDGET_NAME}`;
