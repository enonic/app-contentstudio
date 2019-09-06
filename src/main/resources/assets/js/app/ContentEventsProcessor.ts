import {ContentWizardPanelParams} from './wizard/ContentWizardPanelParams';
import {NewContentEvent} from './create/NewContentEvent';
import {SortContentEvent} from './browse/SortContentEvent';
import {OpenSortDialogEvent} from './browse/OpenSortDialogEvent';
import {MoveContentEvent} from './move/MoveContentEvent';
import {OpenMoveDialogEvent} from './move/OpenMoveDialogEvent';
import {ShowDependenciesEvent} from './browse/ShowDependenciesEvent';
import {ContentUpdatedEvent} from './event/ContentUpdatedEvent';
import {EditContentEvent} from './event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {LayerContext} from './layer/LayerContext';
import {ContentAppBarTabId, ContentAppBarTabMode} from './ContentAppBarTabId';
import {ConfirmLocalContentCreateDialog} from './layer/ConfirmLocalContentCreateDialog';
import AppBarTabId = api.app.bar.AppBarTabId;
import i18n = api.util.i18n;
import ContentSummary = api.content.ContentSummary;
import ContentTypeName = api.schema.content.ContentTypeName;

export class ContentEventsProcessor {

    static openWizardTab(params: ContentWizardPanelParams, tabId: AppBarTabId): Window {
        let wizardUrl = 'main#/' + params.toString();
        // let wizardUrl = 'main#/' +(tabId.getMode() == 'browse' ? 'browse/'+tabId.getId() : params.toString());
        let isNew = !params.contentId;
        let wizardId;
        if (!isNew && navigator.userAgent.search('Chrome') > -1) {
            // add tab id for browsers that can focus tabs by id
            // don't do it for new to be able to create multiple
            // contents of the same type simultaneously
            wizardId = tabId.toString();
        }

        return ContentEventsProcessor.openTab(wizardUrl, wizardId);
    }

    static openTab(url: string, target?: string): Window {
        return window.open(url, target);
    }

    static popupBlocked(win: Window) {
        return !win || win.closed || typeof win.closed === 'undefined';
    }

    static handleNew(newContentEvent: NewContentEvent) {

        let contentTypeSummary = newContentEvent.getContentType();
        let tabId = ContentAppBarTabId.forNew(contentTypeSummary.getName());

        let wizardParams = new ContentWizardPanelParams()
            .setTabId(tabId)
            .setContentTypeName(contentTypeSummary.getContentTypeName())
            .setParentContentId(newContentEvent.getParentContent() ? newContentEvent.getParentContent().getContentId() : undefined)
            .setCreateSite(newContentEvent.getContentType().isSite());

        ContentEventsProcessor.openWizardTab(wizardParams, tabId);
    }

    static handleEdit(event: EditContentEvent) {
        const inheritedContents: ContentSummaryAndCompareStatus[] = ContentEventsProcessor.getInheritedContents(event.getModels());
        const localContents: ContentSummaryAndCompareStatus[] = ContentEventsProcessor.getLocalContents(event.getModels());
        const hasInherited: boolean = inheritedContents.length > 0;

        if (hasInherited) {
            const confirmDialog: ConfirmLocalContentCreateDialog = new ConfirmLocalContentCreateDialog();
            confirmDialog.setYesCallback(() => {
                ContentEventsProcessor.handleEditContents(localContents, ContentAppBarTabMode.EDIT);
                ContentEventsProcessor.handleEditContents(inheritedContents, ContentAppBarTabMode.LOCALIZE);
            });
            confirmDialog.setNoCallback(() => {
                ContentEventsProcessor.handleEditContents(localContents, ContentAppBarTabMode.EDIT);
                ContentEventsProcessor.handleEditContents(inheritedContents, ContentAppBarTabMode.VIEW);
            });
            confirmDialog.open();
        } else {
            ContentEventsProcessor.handleEditContents(event.getModels(), ContentAppBarTabMode.EDIT);
        }
    }

    private static getInheritedContents(contents: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] {
        return contents.filter((content: ContentSummaryAndCompareStatus) => {
            return content.getContentSummary().isInherited();
        });
    }

    private static getLocalContents(contents: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] {
        return contents.filter((content: ContentSummaryAndCompareStatus) => {
            return !content.getContentSummary().isInherited();
        });
    }

    private static handleEditContents(contents: ContentSummaryAndCompareStatus[], mode: ContentAppBarTabMode) {
        contents.every((content: ContentSummaryAndCompareStatus) => {

            if (!content || !content.getContentSummary()) {
                return true;
            }

            const contentSummary: ContentSummary = content.getContentSummary();
            const contentTypeName: ContentTypeName = contentSummary.getType();

            const tabId: ContentAppBarTabId = ContentAppBarTabId.fromMode(mode, contentSummary.getId());

            const wizardParams: ContentWizardPanelParams = new ContentWizardPanelParams()
                .setTabId(tabId)
                .setContentTypeName(contentTypeName)
                .setContentId(contentSummary.getContentId());

            const win: Window = ContentEventsProcessor.openWizardTab(wizardParams, tabId);

            if (ContentEventsProcessor.popupBlocked(win)) {
                api.notify.showWarning(i18n('notify.popupBlocker.admin'), false);

                return false;
            }

            return true;
        });
    }

    static handleUpdated(event: ContentUpdatedEvent) {
        // do something when content is updated
    }

    static handleSort(event: SortContentEvent) {
        const contents: ContentSummaryAndCompareStatus[] = event.getModels();
        new OpenSortDialogEvent(contents[0]).fire();
    }

    static handleMove(event: MoveContentEvent) {
        const contents: ContentSummaryAndCompareStatus[] = event.getModels();
        new OpenMoveDialogEvent(contents.map(content => content.getContentSummary()), event.getRootNode()).fire();
    }

    static handleShowDependencies(event: ShowDependenciesEvent) {
        const mode: string = event.isInbound() ? ContentAppBarTabMode.INBOUND : ContentAppBarTabMode.OUTBOUND;
        const id: string = event.getId().toString();
        const type: string = event.getContentType() ? event.getContentType().toString() : null;
        const layer: string = LayerContext.get().getCurrentLayer().getName();
        const url: string = `main#/${layer}/${mode}/${id}` + (!!type ? `/${type}` : '');

        ContentEventsProcessor.openTab(url);
    }
}
