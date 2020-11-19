import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentName} from 'lib-admin-ui/content/ContentName';
import {ContentSummaryAndCompareStatus} from './ContentSummaryAndCompareStatus';
import {ContentUnnamed} from 'lib-admin-ui/content/ContentUnnamed';
import {ContentIconUrlResolver} from 'lib-admin-ui/content/util/ContentIconUrlResolver';
import {ExtendedViewer} from '../view/ExtendedViewer';
import {ProjectContext} from '../project/ProjectContext';

export class ContentSummaryAndCompareStatusViewer
    extends ExtendedViewer<ContentSummaryAndCompareStatus> {

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

    resolveSubName(object: ContentSummaryAndCompareStatus): string {
        if (object.hasContentSummary()) {
            return this.resolveSubNameForContentSummary(object);
        }

        if (object.hasUploadItem()) {
            return this.resolveSubNameForUploadItem(object);
        }

        return '';
    }

    private resolveSubNameForContentSummary(object: ContentSummaryAndCompareStatus): string {
        const contentSummary: ContentSummary = object.getContentSummary();
        const contentName: ContentName = contentSummary.getName();

        if (this.isRelativePath) {
            return !contentName.isUnnamed() ? contentName.toString() :
                   ContentUnnamed.prettifyUnnamed();
        }

        return !contentName.isUnnamed() ? contentSummary.getPath().toString() :
               ContentPath.fromParent(contentSummary.getPath().getParentPath(),
                   ContentUnnamed.prettifyUnnamed()).toString();
    }

    private toggleState(object: ContentSummaryAndCompareStatus) {
        if (!object || !object.hasContentSummary()) {
            return;
        }
        const contentSummary: ContentSummary = object.getContentSummary();
        const invalid: boolean = !contentSummary.isValid() || !contentSummary.getDisplayName() || contentSummary.getName().isUnnamed();
        const isPendingDelete: boolean = contentSummary.getContentState().isPendingDelete();
        this.toggleClass('invalid', invalid);
        this.toggleClass('pending-delete', isPendingDelete);
        this.toggleClass('readonly', object.isReadOnly());

        if (!invalid && !object.isOnline() && !object.isPendingDelete()) {
            const status: string = contentSummary.getWorkflow().getStateAsString();
            this.getNamesAndIconView().setIconToolTip(i18n(`status.workflow.${status}`));
            this.toggleClass('ready', !isPendingDelete && contentSummary.isReady());
            this.toggleClass('in-progress', !isPendingDelete && contentSummary.isInProgress());
        } else {
            this.removeClass('ready');
            this.removeClass('in-progress');
        }
    }

    private resolveSubNameForUploadItem(object: ContentSummaryAndCompareStatus): string {
        return object.getUploadItem().getName();
    }

    protected resolveSecondaryName(object: ContentSummaryAndCompareStatus): string {
        const projectLang: string = ProjectContext.get().getProject().getLanguage();

        if (!projectLang) {
            return '';
        }

        const itemLang: string = object.getContentSummary()?.getLanguage();

        if (!itemLang) {
            return '(?)';
        }

        if (projectLang !== itemLang) {
            return `(${itemLang})`;
        }

        return '';
    }

    resolveSubTitle(object: ContentSummaryAndCompareStatus): string {
        if (object.hasContentSummary()) {
            return object.getContentSummary().getPath().toString();
        }

        return '';
    }

    resolveIconUrl(object: ContentSummaryAndCompareStatus): string {
        const contentSummary = object.getContentSummary();
        return contentSummary ? new ContentIconUrlResolver().setContent(contentSummary).resolve() : '';
    }
}
