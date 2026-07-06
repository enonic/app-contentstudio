import { getAppName } from '../../cms/app/app';

export const VERSIONS_WIDGET_NAME = 'versions';

export const getVersionsWidgetKey = (): string => `${getAppName()}:${VERSIONS_WIDGET_NAME}`;
