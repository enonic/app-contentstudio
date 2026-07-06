import { getAppName } from '../cms/app/app';

export const DEPENDENCIES_WIDGET_NAME = 'dependencies';

export const getDependenciesWidgetKey = (): string => `${getAppName()}:${DEPENDENCIES_WIDGET_NAME}`;
