import DOMPurify from 'dompurify';

const WIDGET_TAG = 'widget';
const WIDGET_PATTERN = /<widget(\s[^>]*)?>([\s\S]*?)<\/widget>/;
const ASSET_SELECTOR = 'link, script';
const INLINE_DATA_SCRIPT_TYPE = 'application/json';

export type SidebarWidgetMarkup = {
    element: HTMLElement;
    // `<link>` and `<script>` tags lifted out of the markup; they live in document.head while the widget is active.
    assets: HTMLElement[];
};

// Parses markup without loading or running anything in it.
function parseInert(html: string): DocumentFragment {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
}

// Scripts parsed from markup never execute, so each asset is recreated before it reaches the document.
function cloneAsset(asset: HTMLElement): HTMLElement {
    const copy = document.createElement(asset.tagName.toLowerCase());

    for (const { name, value } of Array.from(asset.attributes)) {
        copy.setAttribute(name, value);
    }

    if (asset instanceof HTMLScriptElement && asset.type === INLINE_DATA_SCRIPT_TYPE) {
        copy.textContent = asset.textContent;
    }

    return copy;
}

function createWidgetElement(attributesHtml: string): HTMLElement {
    const parsed = parseInert(`<${WIDGET_TAG}${attributesHtml}></${WIDGET_TAG}>`).firstElementChild;
    const element = document.createElement(WIDGET_TAG);

    for (const { name, value } of Array.from(parsed?.attributes ?? [])) {
        if (DOMPurify.isValidAttribute(WIDGET_TAG, name, value)) {
            element.setAttribute(name, value);
        }
    }

    return element;
}

export function createSidebarWidgetElement(html: string): SidebarWidgetMarkup {
    const match = html.match(WIDGET_PATTERN);
    if (match == null) {
        throw new Error('Widget contents must be wrapped inside <widget></widget> tags');
    }

    const [, attributesHtml = '', contentHtml] = match;

    const content = parseInert(
        DOMPurify.sanitize(contentHtml, {
            ADD_TAGS: ['link', 'script'],
            ADD_ATTR: ['target'],
            // ! Without it the parser puts leading `<link>` and `<script>` tags into `<head>`, and they are dropped.
            FORCE_BODY: true,
        }),
    );

    const assets = Array.from(content.querySelectorAll<HTMLElement>(ASSET_SELECTOR)).map((asset) => {
        const copy = cloneAsset(asset);
        asset.remove();
        return copy;
    });

    const element = createWidgetElement(attributesHtml);
    element.append(content);

    return { element, assets };
}
