/**
 * Utility class for fetching CSS from <link> elements and converting them to <style> elements
 * for injection into Shadow DOM. Includes caching to avoid redundant fetches.
 */
export class ShadowStyleLoader {

    private static styleCache = new Map<string, string>();

    /**
     * Fetches CSS content from a URL and returns it as a <style> element.
     * Results are cached to avoid redundant network requests.
     */
    static async fetchStyleAsElement(href: string): Promise<HTMLStyleElement> {
        const cssText = await this.fetchStyleText(href);
        const styleEl = document.createElement('style');
        styleEl.textContent = cssText;
        styleEl.setAttribute('data-source-href', href);
        return styleEl;
    }

    /**
     * Fetches CSS text content from a URL with caching.
     */
    static async fetchStyleText(href: string): Promise<string> {
        if (this.styleCache.has(href)) {
            return this.styleCache.get(href);
        }

        try {
            const response = await fetch(href);
            if (!response.ok) {
                console.warn(`ShadowStyleLoader: Failed to fetch stylesheet: ${href}`);
                return '';
            }
            const cssText = await response.text();
            this.styleCache.set(href, cssText);
            return cssText;
        } catch (error) {
            console.warn(`ShadowStyleLoader: Error fetching stylesheet: ${href}`, error);
            return '';
        }
    }

    /**
     * Processes an array of <link> elements, fetching their CSS and returning <style> elements.
     * Preserves order of stylesheets.
     */
    static async processLinkElements(linkElements: HTMLLinkElement[]): Promise<HTMLStyleElement[]> {
        const stylePromises = linkElements
            .filter(link => link.rel === 'stylesheet' && link.href)
            .map(link => this.fetchStyleAsElement(link.href));

        return Promise.all(stylePromises);
    }

    /**
     * Clears the style cache. Useful for testing or when stylesheets may have changed.
     */
    static clearCache(): void {
        this.styleCache.clear();
    }
}
