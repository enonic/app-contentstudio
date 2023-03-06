import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
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
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentSummary} from './content/ContentSummary';
import {UrlHelper} from './util/UrlHelper';
import {ContentAppHelper} from './wizard/ContentAppHelper';

export class ContentEventsProcessor {

    static openWindows: Window[] = [];

    static openWizardTab(params: ContentWizardPanelParams): Window {
        const wizardUrl: string = UrlHelper.getPrefixedUrl(ContentEventsProcessor.generateURL(params), '');
        return ContentEventsProcessor.openTab(wizardUrl, ContentEventsProcessor.makeWizardId(params));
    }

    private static makeWizardId(params: ContentWizardPanelParams): string {
        return params.tabId.toString();
    }

    static openTab(url: string, name: string): Window {
        if (ContentEventsProcessor.hasWindowWithName(name)) {
            const existingWindow: Window = ContentEventsProcessor.getWindowWithName(name);

            if (existingWindow.closed) {
                ContentEventsProcessor.removeClosedWindow(existingWindow);
            } else {
                existingWindow.focus();
                return existingWindow;
            }
        }

        return ContentEventsProcessor.openNewTab(url);
    }

    private static openNewTab(url: string): Window {
        const newWindow: Window = window.open(url);
        ContentEventsProcessor.openWindows.push(newWindow);

        return newWindow;
    }

    private static removeClosedWindow(closedWindow: Window): void {
        ContentEventsProcessor.openWindows = ContentEventsProcessor.openWindows.filter((window: Window) => window !== closedWindow);
    }

    static hasWindowWithName(name: string): boolean {
        return ContentEventsProcessor.openWindows.some((window: Window) => window.name === name);
    }

    static getWindowWithName(name: string): Window {
        return ContentEventsProcessor.openWindows.find((window: Window) => window.name === name);
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
            .setParentContentId(newContentEvent.getParentContent()?.getContentId() || undefined)
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
                .setProject(event.getProject())
                .setLocalized(event.isLocalized())
                .setContentId(contentSummary.getContentId())
                .setDisplayAsNew(!!event.isDisplayAsNew && event.isDisplayAsNew());

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
        const url = UrlHelper.getPrefixedUrl(`${project}/${mode}/${id}${!!type ? `/${type}` : ''}`);

        ContentEventsProcessor.openNewTab(url);
    }

    private static generateURL(params: ContentWizardPanelParams): string {
        const project: string = params.project.getName();

        if (params.tabId && params.tabId.isBrowseMode()) {
            return `${project}/${UrlAction.BROWSE}/${params.tabId.getId()}`;
        }

        if (!!params.contentId) {
            const action: string = UrlAction.EDIT;
            const editParams: string = this.makeEditParams(params);
            return `${project}/${action}/${params.contentId.toString()}${editParams}`;
        }

        const parentPostfix: string = params.parentContentId ? `/${params.parentContentId.toString()}` : '';
        return `${project}/${UrlAction.NEW}/${params.contentTypeName.toString()}${parentPostfix}`;

    }

    private static makeEditParams(params: ContentWizardPanelParams): string {
        const paramsList: string[] = [];

        if (params.displayAsNew) {
            paramsList.push(ContentAppHelper.DISPLAY_AS_NEW);
        }

        if (params.localized) {
            paramsList.push(ContentAppHelper.LOCALIZED);
        }

        if (paramsList.length > 0) {
            let result: string = '?';

            paramsList.forEach((param: string, index: number) => {
                result = result + (index === 0 ? '' : '&') + param;
            });

            return result;
        }

        return '';
    }
}
