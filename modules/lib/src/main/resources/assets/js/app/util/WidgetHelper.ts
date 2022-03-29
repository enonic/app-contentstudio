import {Element as UIElement} from 'lib-admin-ui/dom/Element';

export class WidgetHelper {

    static injectWidgetHtml(html: string, target: UIElement): { scriptElements: HTMLScriptElement[], widgetContainer: UIElement } {
        const widgetContainer: UIElement = UIElement.fromHtml(html);

        if (widgetContainer?.getHTMLElement().tagName !== 'WIDGET') {
            throw 'Widget contents must be wrapped inside <widget></widget> tags';
        }

        const scriptElements: HTMLScriptElement[] = WidgetHelper.injectScriptsToHead(widgetContainer);
        target.appendChild(widgetContainer);

        return {scriptElements, widgetContainer};
    }

    static injectScriptsToHead(widgetContainer: UIElement): HTMLScriptElement[] {
        const scriptTags: NodeListOf<HTMLScriptElement> = widgetContainer.getHTMLElement().querySelectorAll('script');
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
}
