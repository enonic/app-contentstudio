import { getAppName } from '../cms/app/app';

export const PAGE_EDITOR_WIDGET_NAME = 'page';

export const getPageEditorWidgetKey = (): string => `${getAppName()}:${PAGE_EDITOR_WIDGET_NAME}`;
