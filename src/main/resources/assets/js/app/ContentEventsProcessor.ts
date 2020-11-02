import {showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentWizardPanelParams} from './wizard/ContentWizardPanelParams';
import {NewContentEvent} from './create/NewContentEvent';
import {SortContentEvent} from './browse/sort/SortContentEvent';
import {OpenSortDialogEvent} from './browse/OpenSortDialogEvent';
import {MoveContentEvent} from './move/MoveContentEvent';
import {OpenMoveDialogEvent} from './move/OpenMoveDialogEvent';
import {ShowDependenciesEvent} from './browse/ShowDependenciesEvent';
import {ContentUpdatedEvent} from './event/ContentUpdatedEvent';
import {EditContentEvent} from './event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {ProjectContext} from './project/ProjectContext';
import {ContentAppBarTabId} from './ContentAppBarTabId';
import {UrlAction} from './UrlAction';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {AppMode} from './AppMode';

export class ContentEventsProcessor {

    static openWizardTab(params: ContentWizardPanelParams): Window {
        const wizardUrl: string = `${AppMode.MAIN}#/${ContentEventsProcessor.generateURL(params)}`;
        return ContentEventsProcessor.openTab(wizardUrl, ContentEventsProcessor.makeWizardId(params));
    }

    private static makeWizardId(params: ContentWizardPanelParams): string {
        const isNew: boolean = !params.contentId;

        if (isNew) {
            return undefined;
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
            const tabId: ContentAppBarTabId = ContentAppBarTabId.forEdit(`${event.getProject().getName()}/${contentSummary.getId()}`);
            const isLocalize: boolean = !content.isReadOnly() && content.isDataInherited() && event.getProject().getName() ===
                                        ProjectContext.get().getProject().getName();

            const wizardParams: ContentWizardPanelParams = new ContentWizardPanelParams()
                .setTabId(tabId)
                .setContentTypeName(contentTypeName)
                .setProject(event.getProject())
                .setLocalize(isLocalize)
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
        new OpenMoveDialogEvent(contents.map(content => content.getContentSummary()), event.getTreeGrid()).fire();
    }

    static handleShowDependencies(event: ShowDependenciesEvent) {
        const mode: string = event.isInbound() ? UrlAction.INBOUND : UrlAction.OUTBOUND;
        const id: string = event.getId().toString();
        const type: string = event.getContentType() ? event.getContentType().toString() : null;
        const project: string = ProjectContext.get().getProject().getName();
        const url = `${AppMode.MAIN}#/${project}/${mode}/${id}` + (!!type ? `/${type}` : '');

        ContentEventsProcessor.openTab(url);
    }

    private static generateURL(params: ContentWizardPanelParams): string {
        const project: string = params.project.getName();

        if (params.tabId && params.tabId.isBrowseMode()) {
            return `${project}/${UrlAction.BROWSE}/${params.tabId.getId()}`;
        }

        if (!!params.contentId) {
            const action: string = params.localize ? UrlAction.LOCALIZE : UrlAction.EDIT;
            return `${project}/${action}/${params.contentId.toString()}`;
        }

        if (params.parentContentId) {
            return `${project}/${UrlAction.NEW}/${params.contentTypeName.toString()}/${params.parentContentId.toString()}`;
        }

        return `${project}/${UrlAction.NEW}/${params.contentTypeName.toString()}`;

    }
}
