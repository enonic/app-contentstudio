import {ShadowStyleLoader} from './ShadowStyleLoader';
import {WidgetScriptExecutor} from './WidgetScriptExecutor';

/**
 * Custom element that encapsulates external widget content in Shadow DOM,
 * providing CSS isolation and controlled script execution.
 *
 * Usage:
 *   const widget = document.createElement('external-widget') as ExternalWidgetElement;
 *   container.appendChild(widget);
 *   await widget.setWidgetContent(htmlString);
 */
export class ExternalWidgetElement extends HTMLElement {

    private scriptExecutor: WidgetScriptExecutor | null = null;

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    /**
     * Called when the element is removed from the document.
     * Cleans up all resources (scripts, timers, listeners).
     */
    disconnectedCallback(): void {
        this.cleanup();
    }

    /**
     * Sets the widget content by parsing HTML, processing styles into Shadow DOM,
     * and executing scripts in a controlled scope.
     */
    async setWidgetContent(html: string): Promise<void> {
        // Clean up any previous content
        this.cleanup();

        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract link elements for stylesheet processing
        const linkElements = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));

        // Extract script elements for later execution
        const scriptElements = Array.from(doc.querySelectorAll<HTMLScriptElement>('script'));

        // Remove link and script elements from the document before appending content
        linkElements.forEach(link => link.remove());
        scriptElements.forEach(script => script.remove());

        // Clear shadow root
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }

        // Fetch and inject stylesheets
        const styleElements = await ShadowStyleLoader.processLinkElements(linkElements);
        styleElements.forEach(style => this.shadowRoot.appendChild(style));

        // Process inline <style> elements from the parsed document
        const inlineStyles = Array.from(doc.querySelectorAll<HTMLStyleElement>('style'));
        inlineStyles.forEach(style => {
            const newStyle = document.createElement('style');
            newStyle.textContent = style.textContent;
            this.shadowRoot.appendChild(newStyle);
            style.remove();
        });

        // Append the remaining content (body content)
        const contentFragment = document.createDocumentFragment();
        Array.from(doc.body.childNodes).forEach(node => {
            contentFragment.appendChild(document.importNode(node, true));
        });
        this.shadowRoot.appendChild(contentFragment);

        // Create script executor and execute scripts
        this.scriptExecutor = new WidgetScriptExecutor(this.shadowRoot);

        // Execute scripts in order (respecting dependencies)
        for (const scriptEl of scriptElements) {
            await this.scriptExecutor.executeScript(scriptEl);
        }
    }

    /**
     * Cleans up all resources associated with this widget.
     * Should be called before setting new content or when the widget is deactivated.
     */
    cleanup(): void {
        if (this.scriptExecutor) {
            this.scriptExecutor.cleanup();
            this.scriptExecutor = null;
        }

        // Clear shadow root content
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }
    }

    /**
     * Returns whether the widget has content loaded.
     */
    hasContent(): boolean {
        return this.shadowRoot.childNodes.length > 0;
    }
}

// Register the custom element
if (!customElements.get('external-widget')) {
    customElements.define('external-widget', ExternalWidgetElement);
}
