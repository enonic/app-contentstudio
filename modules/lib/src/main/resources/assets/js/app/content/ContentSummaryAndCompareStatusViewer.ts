import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {ContentSummaryAndCompareStatus} from './ContentSummaryAndCompareStatus';
import {ExtendedViewer} from '../view/ExtendedViewer';
import {ProjectContext} from '../project/ProjectContext';
import {ContentIconUrlResolver} from './ContentIconUrlResolver';
import {ContentSummary} from './ContentSummary';
import {ContentName} from './ContentName';
import {ContentPath} from './ContentPath';
import {Workflow} from './Workflow';

export class ContentSummaryAndCompareStatusViewer
    extends ExtendedViewer<ContentSummaryAndCompareStatus> {

    constructor() {
        super('content-summary-and-compare-status-viewer');
    }

    doLayout(object: ContentSummaryAndCompareStatus) {
        super.doLayout(object);

        this.resolveStateClass(object);
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
                   NamePrettyfier.prettifyUnnamed();
        }

        return !contentName.isUnnamed() ? contentSummary.getPath().toString() :
               ContentPath.create().fromParent(contentSummary.getPath().getParentPath(),
                   NamePrettyfier.prettifyUnnamed()).build().toString();
    }

    private resolveStateClass(object: ContentSummaryAndCompareStatus) {
        if (!object || !object.hasContentSummary()) {
            return;
        }
        const contentSummary: ContentSummary = object.getContentSummary();
        const invalid: boolean = !contentSummary.isValid() || !contentSummary.getDisplayName() || contentSummary.getName().isUnnamed();
        const isPendingDelete: boolean = contentSummary.getContentState().isPendingDelete();
        this.toggleClass('invalid', invalid);
        this.toggleClass('has-origin-project', object.hasOriginProject());
        this.toggleClass('data-inherited', object.isDataInherited());
        this.toggleClass('sort-inherited', object.isSortInherited());
        this.toggleClass('icon-variant', object.isVariant());

        if (object.isReadOnly()) {
            this.setTitle(i18n('field.readOnly'));
        }

        if (!invalid && !object.isOnline()) {
            const workflowState = this.resolveWorkflowState(object);
            this.getNamesAndIconView().setIconToolTip(workflowState);
            this.toggleClass('ready', !isPendingDelete && contentSummary.isReady());
            this.toggleClass('in-progress', !isPendingDelete && contentSummary.isInProgress());
        } else {
            this.getNamesAndIconView().setIconToolTip('');
            this.removeClass('ready');
            this.removeClass('in-progress');
        }
    }

    protected resolveWorkflowState(object: ContentSummaryAndCompareStatus): string {
        const workflow: Workflow = object.getContentSummary().getWorkflow();
        return workflow ? i18n(`status.workflow.${workflow.getState()}`) : '';
    }

    protected resolveSubNameForUploadItem(object: ContentSummaryAndCompareStatus): string {
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
