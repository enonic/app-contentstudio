import {ShadowStyleLoader} from './ShadowStyleLoader';
import {WidgetScriptExecutor} from './WidgetScriptExecutor';

/**
 * Custom element that encapsulates external widget content in Shadow DOM,
 * providing CSS isolation and JavaScript isolation via document method interception.
 *
 * This implementation is CSP-compliant:
 * - Uses the page's nonce for script execution (no 'unsafe-eval' required)
 * - Scripts execute within the shadow root
 * - Document query methods are intercepted to redirect to the shadow root
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
     * and executing scripts with nonce-based CSP compliance.
     */
    async setWidgetContent(html: string): Promise<void> {
        // Clean up any previous content
        this.cleanup();

        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract link elements for stylesheet processing
        const linkElements = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));

        // Extract only EXECUTABLE script elements (not data scripts like type="application/json")
        // Data scripts need to stay in the shadow root so getElementById can find them
        const allScripts = Array.from(doc.querySelectorAll<HTMLScriptElement>('script'));
        const executableScripts: HTMLScriptElement[] = [];
        const dataScripts: HTMLScriptElement[] = [];

        allScripts.forEach(script => {
            const type = script.type?.toLowerCase() || '';
            // Data scripts: application/json, application/ld+json, text/template, etc.
            const isDataScript = type === 'application/json' ||
                                 type === 'application/ld+json' ||
                                 type === 'text/template' ||
                                 type === 'text/html';
            if (isDataScript) {
                dataScripts.push(script);
            } else {
                executableScripts.push(script);
            }
        });

        // Remove link elements and executable scripts from the document
        // Keep data scripts in place so they end up in the shadow root
        linkElements.forEach(link => link.remove());
        executableScripts.forEach(script => script.remove());

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

        // Append the remaining content (body content, including data scripts)
        const contentFragment = document.createDocumentFragment();
        Array.from(doc.body.childNodes).forEach(node => {
            contentFragment.appendChild(document.importNode(node, true));
        });
        this.shadowRoot.appendChild(contentFragment);

        // Create script executor and execute only executable scripts
        this.scriptExecutor = new WidgetScriptExecutor(this.shadowRoot);

        // Execute scripts in order (respecting dependencies)
        for (const scriptEl of executableScripts) {
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
