import {Element as UIElement} from '@enonic/lib-admin-ui/dom/Element';
import {WidgetInjectionResult} from './WidgetInjectionResult';

export class WidgetHelper {

    static injectWidgetHtml(html: string, target: UIElement): WidgetInjectionResult {
        const widgetRegexResult: RegExpMatchArray = html.match(/<widget(\s.*?)?>[\s\S]*?<\/widget>/g);

        if (!widgetRegexResult) {
            throw Error('Widget contents must be wrapped inside <widget></widget> tags');
        }

        const widgetContainer: UIElement = UIElement.fromHtml(widgetRegexResult[0]);
        const scriptElements: HTMLScriptElement[] = WidgetHelper.injectScriptsToHead(widgetContainer);
        const linkElements: HTMLLinkElement[] = WidgetHelper.injectLinksToHead(widgetContainer);
        target.appendChild(widgetContainer);

        return {scriptElements, linkElements, widgetContainer};
    }

    static injectScriptsToHead(widgetContainer: UIElement): HTMLScriptElement[] {
        return this.injectToHead(widgetContainer, 'script') as HTMLScriptElement[];
    }

    static injectLinksToHead(widgetContainer: UIElement): HTMLLinkElement[] {
        return this.injectToHead(widgetContainer, 'link') as HTMLLinkElement[];
    }

    private static injectToHead(widgetContainer: UIElement, tagName: string): HTMLElement[] {
        const scriptTags: NodeListOf<HTMLElement> = widgetContainer.getHTMLElement().querySelectorAll(tagName);
        const result: HTMLElement[] = [];

        scriptTags.forEach((scriptTag: HTMLElement) => {
            scriptTag.remove(); // removing tag from widget html and moving it to head
            result.push(this.injectNodeToHead(scriptTag, tagName));
        });

        return result;
    }

    private static injectNodeToHead(node: HTMLElement, tagName: string): HTMLElement {
        const headNode: HTMLElement = document.createElement(tagName);
        headNode.innerHTML = node.innerHTML;

        for (let i = node.attributes.length - 1; i >= 0; i--) {
            headNode.setAttribute(node.attributes[i].name, node.attributes[i].value);
        }

        document.getElementsByTagName('head')[0].appendChild(headNode);

        return headNode;
    }
}
