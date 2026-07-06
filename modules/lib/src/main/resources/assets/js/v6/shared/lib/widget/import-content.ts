import { getAppName } from '../cms/app/app';

export const IMPORT_CONTENT_WIDGET_NAME = 'import-content';

export const getImportContentWidgetKey = (): string => `${getAppName()}:${IMPORT_CONTENT_WIDGET_NAME}`;
