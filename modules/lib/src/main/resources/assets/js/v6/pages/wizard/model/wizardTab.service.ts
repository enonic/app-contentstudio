import { NamePrettyfier } from '@enonic/lib-admin-ui/NamePrettyfier';
import type { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type { ContentId } from '../../../../app/content/ContentId';
import { ContentIconUrlResolver } from '../../../../app/content/ContentIconUrlResolver';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { ContentUpdatedEvent } from '../../../../app/event/ContentUpdatedEvent';
import { i18n } from '../../../shared/i18n';

//
// * Wizard Tab Service
//
// The browser tab of a wizard: its title follows the display name of the content,
// and its favicon shows the content's icon where the browser can render it.
//

const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

// The favicon links whose href was replaced by the placeholder, by their original href.
const replacedFavicons = new Map<string, HTMLElement>();

// The svg favicon while it is out of the document, with the link it was declared before.
let removedSvg: { link: Element; before: Element | null } | undefined;

export function setWizardTabTitle(title: string): void {
    document.title = `${title} / ${i18n('app.name')}`;
}

/** The title of a content that has no display name yet. */
export function resolveUnnamedTabTitle(contentTypeTitle: string): string {
    return NamePrettyfier.prettifyUnnamed(contentTypeTitle);
}

export function canShowContentFavicon(contentTypeName: ContentTypeName): boolean {
    // Chrome does not show the SVG icons that are served for contents other than images.
    return contentTypeName.isImage() || !navigator.userAgent.includes('Chrome');
}

/** Blanks the application favicons until the content's icon is known. */
export function clearWizardTabFavicon(): void {
    document.querySelectorAll<HTMLElement>('link[rel*=icon][sizes]').forEach((link) => {
        replacedFavicons.set(link.getAttribute('href') ?? '', link);
        link.setAttribute('href', PLACEHOLDER);
    });

    // A png href cannot override the svg favicon, so it leaves the document while the tab shows the content icon.
    const svg = document.querySelector('link[rel~="icon"][type="image/svg+xml"]');
    if (svg) {
        // it outranks the png ones, so it is put back exactly where it was declared
        removedSvg = { link: svg, before: document.querySelector('link[rel~="icon"][type="image/png"]') };
        svg.remove();
    }
}

/** Shows the content's icon in the blanked favicons, or restores the application ones. */
export function updateWizardTabFavicon(content: ContentSummary): void {
    const resolver = new ContentIconUrlResolver().setContent(content).setCrop(false);
    const showsContentIcon = canShowContentFavicon(content.getType());

    replacedFavicons.forEach((link, href) => {
        if (showsContentIcon) {
            const size = parseInt(link.getAttribute('sizes')?.split('x')[0] ?? '', 10);
            if (!Number.isNaN(size)) resolver.setSize(size);

            link.setAttribute('href', resolver.resolve());
        } else {
            link.setAttribute('href', href);
        }
    });
    replacedFavicons.clear();

    if (removedSvg && !showsContentIcon) {
        document.head.insertBefore(removedSvg.link, removedSvg.before);
        removedSvg = undefined;
    }
}

export function showContentInWizardTab(content: ContentSummary): void {
    updateWizardTabFavicon(content);
    setWizardTabTitle(content.getDisplayName());
}

/** Keeps the tab showing the content as it is updated. */
export function followContentInWizardTab(contentId: ContentId): void {
    ContentUpdatedEvent.on((event: ContentUpdatedEvent) => {
        if (!event.getContentId().equals(contentId)) return;

        clearWizardTabFavicon();
        showContentInWizardTab(event.getContentSummary());
    });
}
