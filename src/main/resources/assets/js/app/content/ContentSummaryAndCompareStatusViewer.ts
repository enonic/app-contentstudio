import ContentPath = api.content.ContentPath;
import ContentName = api.content.ContentName;
import ContentSummary = api.content.ContentSummary;
import i18n = api.util.i18n;
import {ContentSummaryAndCompareStatus} from './ContentSummaryAndCompareStatus';

export class ContentSummaryAndCompareStatusViewer
    extends api.ui.NamesAndIconViewer<ContentSummaryAndCompareStatus> {

    constructor() {
        super('content-summary-and-compare-status-viewer');
    }

    doLayout(object: ContentSummaryAndCompareStatus) {
        super.doLayout(object);

        this.toggleState(object);
    }

    resolveDisplayName(object: ContentSummaryAndCompareStatus): string {
        if (object.hasContentSummary()) {
            return object.getContentSummary().getDisplayName();
        }

        if (object.hasUploadItem()) {
            return object.getUploadItem().getName();
        }

        return '';
    }

    resolveUnnamedDisplayName(object: ContentSummaryAndCompareStatus): string {
        const contentSummary: ContentSummary = object.getContentSummary();
        return (contentSummary && contentSummary.getType()) ? contentSummary.getType().getLocalName() : '';
    }

    resolveSubName(object: ContentSummaryAndCompareStatus, relativePath: boolean = false): string {
        if (object.hasContentSummary()) {
            return this.resolveSubNameForContentSummary(object, relativePath);
        }

        if (object.hasUploadItem()) {
            return this.resolveSubNameForUploadItem(object);
        }

        return '';
    }

    private resolveSubNameForContentSummary(object: ContentSummaryAndCompareStatus, relativePath: boolean): string {
        const contentSummary: ContentSummary = object.getContentSummary();
        const contentName: ContentName = contentSummary.getName();

        if (relativePath) {
            return !contentName.isUnnamed() ? contentName.toString() :
                   api.content.ContentUnnamed.prettifyUnnamed();
        } else {
            return !contentName.isUnnamed() ? contentSummary.getPath().toString() :
                   ContentPath.fromParent(contentSummary.getPath().getParentPath(),
                       api.content.ContentUnnamed.prettifyUnnamed()).toString();
        }
    }

    private toggleState(object: ContentSummaryAndCompareStatus) {
        const contentSummary: ContentSummary = object.getContentSummary();
        const invalid: boolean = !contentSummary.isValid() || !contentSummary.getDisplayName() || contentSummary.getName().isUnnamed();
        const isPendingDelete: boolean = contentSummary.getContentState().isPendingDelete();
        this.toggleClass('invalid', invalid);
        this.toggleClass('pending-delete', isPendingDelete);

        if (!invalid && !object.isOnline()) {
            const status: string = contentSummary.getWorkflow().getStateAsString();
            this.getNamesAndIconView().setIconToolTip(i18n(`status.workflow.${status}`));
            this.toggleClass('ready', contentSummary.isReady());
            this.toggleClass('in-progress', contentSummary.isInProgress());
        }
    }

    private resolveSubNameForUploadItem(object: ContentSummaryAndCompareStatus): string {
        return object.getUploadItem().getName();
    }

    resolveSubTitle(object: ContentSummaryAndCompareStatus): string {
        if (object.hasContentSummary()) {
            return object.getContentSummary().getPath().toString();
        }

        return '';
    }

    resolveIconClass(): string {
        return '';
    }

    resolveIconUrl(object: ContentSummaryAndCompareStatus): string {

        let contentSummary = object.getContentSummary();
        return !!contentSummary ? new api.content.util.ContentIconUrlResolver().setContent(contentSummary).resolve() : '';
    }
}
