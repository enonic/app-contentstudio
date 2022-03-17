import {Element as UIElement} from 'lib-admin-ui/dom/Element';

export class WidgetHelper {

    static injectWidgetHtml(html: string, target: UIElement): { scriptElements: HTMLScriptElement[], resultElement: UIElement } {
        const widgetContainer: HTMLHtmlElement = document.createElement('html');
        widgetContainer.innerHTML = html;

        const scriptElements: HTMLScriptElement[] = WidgetHelper.injectScriptsToHead(widgetContainer);
        const resultElement: UIElement = WidgetHelper.injectWidgetElementInto(widgetContainer, target);

        return {scriptElements, resultElement};
    }

    static injectScriptsToHead(widgetContainer: HTMLElement): HTMLScriptElement[] {
        const scriptTags: NodeListOf<HTMLScriptElement> = widgetContainer.querySelectorAll('script');
        const result: HTMLScriptElement[] = [];

        scriptTags.forEach((scriptTag: HTMLScriptElement) => {
            result.push(this.injectScriptNodeToHead(scriptTag));
        });

        return result;
    }

    static injectScriptNodeToHead(node: HTMLElement): HTMLScriptElement {
        const scriptNode: HTMLScriptElement = document.createElement('script');
        scriptNode.text = node.innerHTML;

        for (let i = node.attributes.length - 1; i >= 0; i--) {
            scriptNode.setAttribute(node.attributes[i].name, node.attributes[i].value);
        }

        document.getElementsByTagName('head')[0].appendChild(scriptNode);

        return scriptNode;
    }

    static injectWidgetElementInto(widgetContainer: HTMLElement, target: UIElement): UIElement {
        const widgetEl: HTMLElement = widgetContainer.querySelector('widget');

        if (!widgetEl) {
            return;
        }

        const result: UIElement = UIElement.fromHtmlElement(widgetEl);
        target.appendChild(result);

        return result;
    }
}
