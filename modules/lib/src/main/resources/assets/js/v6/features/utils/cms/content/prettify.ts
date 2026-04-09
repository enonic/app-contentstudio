import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentPath} from '../../../../../app/content/ContentPath';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {ContentUnnamed} from '../../../../../app/content/ContentUnnamed';

export function resolveDisplayName(summary: ContentSummary): string {
    return summary.getDisplayName() || normalizeDisplayName(resolveUnnamedDisplayName(summary));
}

function normalizeDisplayName(displayName: string): string {
    if (!displayName) {
        return `<${i18n('field.displayName')}>`;
    }
    return NamePrettyfier.prettifyUnnamed(displayName);
}

function resolveUnnamedDisplayName(summary: ContentSummary): string {
    return summary.getType() ? summary.getType().getLocalName() : '';
}

export function resolveSubName(summary: ContentSummary): string {
    const contentName = summary.getName();

    return !contentName.isUnnamed() ? contentName.toString() :
           NamePrettyfier.prettifyUnnamed();
}

/**
 * Resolves path for display, prettifying any unnamed elements.
 * @param summary - Content to resolve path for
 * @param full - If true, returns full path; if false, returns just the name portion
 * @returns Prettified path string
 */
export function resolvePath(summary: ContentSummary, full = false, pretty = true): string {
    const path = summary.getPath();

    if (full) {
        return pretty ? prettifyPathElements(path) : '/' + path.getElements().join('/');
    }

    const name = path.getName();
    return pretty ? prettifyPathElement(name) : name;
}

/**
 * Prettifies all path elements, replacing unnamed prefixes with localized <Unnamed>.
 */
function prettifyPathElements(path: ContentPath): string {
    const elements = path.getElements();
    const prettyElements = elements.map(prettifyPathElement);
    return '/' + prettyElements.join('/');
}

/**
 * Prettifies a single path element if it contains the unnamed prefix.
 */
function prettifyPathElement(element: string): string {
    if (element.indexOf(ContentUnnamed.UNNAMED_PREFIX) === 0) {
        return '<' + NamePrettyfier.getPrettyUnnamed() + '>';
    }
    return element;
}
