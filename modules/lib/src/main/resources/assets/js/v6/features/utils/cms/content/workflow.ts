import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {WorkflowStateStatus} from '../../../../../app/wizard/WorkflowStateManager';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export function calcWorkflowStateStatus(summary: ContentSummary | null | undefined): WorkflowStateStatus | null {
    if (!summary) {
        return null;
    }
    if (!summary.isValid()) {
        return WorkflowStateStatus.INVALID;
    }
    if (summary.isReady()) {
        return WorkflowStateStatus.READY;
    }
    if (summary.isInProgress()) {
        return WorkflowStateStatus.IN_PROGRESS;
    }
    return null;
}

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
