import {Element} from 'lib-admin-ui/dom/Element';

export interface WidgetInjectionResult {
    scriptElements: HTMLScriptElement[],
    linkElements: HTMLLinkElement[],
    widgetContainer: Element
}
