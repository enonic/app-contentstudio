import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentPath} from '../../../../../app/content/ContentPath';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentUnnamed} from '../../../../../app/content/ContentUnnamed';

export function resolveDisplayName(object: ContentSummaryAndCompareStatus): string {
    return getDisplayName(object) || normalizeDisplayName(resolveUnnamedDisplayName(object));
}

function getDisplayName(object: ContentSummaryAndCompareStatus): string {
    if (object.hasContentSummary()) {
        return object.getContentSummary().getDisplayName();
    }

    if (object.hasUploadItem()) {
        return object.getUploadItem().getName();
    }

    return '';
}

function normalizeDisplayName(displayName: string): string {
    if (!displayName) {
        return `<${i18n('field.displayName')}>`;
    }
    return NamePrettyfier.prettifyUnnamed(displayName);
}

function resolveUnnamedDisplayName(object: ContentSummaryAndCompareStatus): string {
    const contentSummary: ContentSummary = object.getContentSummary();
    return (contentSummary && contentSummary.getType()) ? contentSummary.getType().getLocalName() : '';
}

export function resolveSubName(object: ContentSummaryAndCompareStatus): string {
    if (object.hasContentSummary()) {
        return resolveSubNameForContentSummary(object);
    }

    if (object.hasUploadItem()) {
        return object.getUploadItem().getName();
    }

    return '';
}

function resolveSubNameForContentSummary(object: ContentSummaryAndCompareStatus): string {
    const contentSummary: ContentSummary = object.getContentSummary();
    const contentName = contentSummary.getName();

    return !contentName.isUnnamed() ? contentName.toString() :
           NamePrettyfier.prettifyUnnamed();
}

/**
 * Resolves path for display, prettifying any unnamed elements.
 * @param content - Content to resolve path for
 * @param full - If true, returns full path; if false, returns just the name portion
 * @returns Prettified path string
 */
export function resolvePath(content: ContentSummaryAndCompareStatus, full = false, pretty = true): string {
    const path = content.getPath();

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
