import {showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
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
import {ProjectContext} from './project/ProjectContext';
import {ContentAppBarTabId} from './ContentAppBarTabId';
import {ContentAppMode} from './ContentAppMode';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

export class ContentEventsProcessor {

    static openWizardTab(params: ContentWizardPanelParams): Window {
        const wizardUrl: string = `main#/${ContentEventsProcessor.generateURL(params)}`;
        return ContentEventsProcessor.openTab(wizardUrl, ContentEventsProcessor.makeWizardId(params));
    }

    private static makeWizardId(params: ContentWizardPanelParams): string {
        const isNew: boolean = !params.contentId;

        if (isNew) {
            return null;
        }

        return params.tabId.toString();
    }

    static openTab(url: string, target?: string): Window {
        return window.open(url, target);
    }

    static popupBlocked(win: Window) {
        return !win || win.closed || typeof win.closed === 'undefined';
    }

    static handleNew(newContentEvent: NewContentEvent) {
        const contentTypeSummary: ContentTypeSummary = newContentEvent.getContentType();
        const tabId: ContentAppBarTabId = ContentAppBarTabId.forNew(contentTypeSummary.getName());

        const wizardParams: ContentWizardPanelParams = new ContentWizardPanelParams()
            .setTabId(tabId)
            .setContentTypeName(contentTypeSummary.getContentTypeName())
            .setParentContentId(newContentEvent.getParentContent() ? newContentEvent.getParentContent().getContentId() : undefined)
            .setCreateSite(newContentEvent.getContentType().isSite());

        ContentEventsProcessor.openWizardTab(wizardParams);
    }

    static handleEdit(event: EditContentEvent) {
        event.getModels().every((content: ContentSummaryAndCompareStatus) => {

            if (!content || !content.getContentSummary()) {
                return true;
            }

            const contentSummary: ContentSummary = content.getContentSummary();
            const contentTypeName: ContentTypeName = contentSummary.getType();
            const tabId: ContentAppBarTabId = ContentAppBarTabId.forEdit(contentSummary.getId());

            const wizardParams: ContentWizardPanelParams = new ContentWizardPanelParams()
                .setTabId(tabId)
                .setContentTypeName(contentTypeName)
                .setContentId(contentSummary.getContentId());

            const win: Window = ContentEventsProcessor.openWizardTab(wizardParams);

            if (ContentEventsProcessor.popupBlocked(win)) {
                showWarning(i18n('notify.popupBlocker.admin'), false);

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
        const mode: string = event.isInbound() ? ContentAppMode.INBOUND : ContentAppMode.OUTBOUND;
        const id: string = event.getId().toString();
        const type: string = event.getContentType() ? event.getContentType().toString() : null;
        const project: string = ProjectContext.get().getProject();
        const url = `main#/${project}/${mode}/${id}/${type}` + (!!type ? `/${type}` : '');

        ContentEventsProcessor.openTab(url);
    }

    private static generateURL(params: ContentWizardPanelParams): string {
        const project: string = ProjectContext.get().getProject();

        if (params.tabId && params.tabId.isBrowseMode()) {
            return `${project}/${ContentAppMode.BROWSE}/${params.tabId.getId()}`;
        }

        if (!!params.contentId) {
            return `${project}/${ContentAppMode.EDIT}/${params.contentId.toString()}`;
        }

        if (params.parentContentId) {
            return `${project}/${ContentAppMode.NEW}/${params.contentTypeName.toString()}/${params.parentContentId.toString()}`;
        }

        return `${project}/${ContentAppMode.NEW}/${params.contentTypeName.toString()}`;

    }
}
