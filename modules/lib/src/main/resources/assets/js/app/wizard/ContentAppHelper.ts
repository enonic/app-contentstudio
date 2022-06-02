import {ContentWizardPanelParams} from './ContentWizardPanelParams';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentAppBarTabId} from '../ContentAppBarTabId';
import {UrlAction} from '../UrlAction';
import {ContentId} from '../content/ContentId';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export class ContentAppHelper {

    private static getContentWizardUrlPattern(action: string): string {
        return `(${CONFIG.getString('toolUri')})/(.+)/(${action})/.+$`;
    }

    static isContentWizardUrlMatch(action: string): boolean {
        const matchUrl = ContentAppHelper.getContentWizardUrlPattern(action);

        return new RegExp(matchUrl).test(window.location.pathname);
    }

    static isContentWizardUrl(): boolean {
        return ContentAppHelper.isContentWizardUrlMatch(`${UrlAction.EDIT}|${UrlAction.LOCALIZE}|${UrlAction.NEW}`);
    }

    static createWizardParamsFromUrl(): ContentWizardPanelParams {
        if (ContentAppHelper.isContentWizardUrlMatch(UrlAction.NEW)) {
            return ContentAppHelper.createWizardParamsForNew();
        }

        return ContentAppHelper.createWizardParamsForEdit();
    }

    private static getActionArguments(action: string): string[] {
        if (!ContentAppHelper.isContentWizardUrlMatch(action)) {
            throw `Incorrect URL pattern for ${action}`;
        }

        const match = window.location.pathname.match(`(${action})/.+$`);
        if (!match[0]) {
            throw `Missing arguments for ${action}`;
        }

        return match[0].split('/').slice(1);
    }

    private static createWizardParamsForNew(): ContentWizardPanelParams {
        const actionArguments: string[] = ContentAppHelper.getActionArguments(UrlAction.NEW);
        const contentTypeName: ContentTypeName = new ContentTypeName(actionArguments[0]);
        const tabId: ContentAppBarTabId = ContentAppBarTabId.forNew(contentTypeName.getApplicationKey().getName());
        const wizardParams: ContentWizardPanelParams = new ContentWizardPanelParams()
            .setContentTypeName(contentTypeName)
            .setCreateSite(contentTypeName.isSite())
            .setTabId(tabId);

        if (actionArguments[1]) {
            wizardParams.setParentContentId(new ContentId(actionArguments[1]));
        }

        return wizardParams;
    }

    private static createWizardParamsForEdit(): ContentWizardPanelParams {
        const actionArguments: string[] = ContentAppHelper.getActionArguments(`${UrlAction.EDIT}|${UrlAction.LOCALIZE}`);

        const contentId = new ContentId(actionArguments[0]);
        const tabId: ContentAppBarTabId = ContentAppBarTabId.forEdit(contentId.toString());

        return new ContentWizardPanelParams()
            .setContentId(contentId)
            .setTabId(tabId);
    }
}
