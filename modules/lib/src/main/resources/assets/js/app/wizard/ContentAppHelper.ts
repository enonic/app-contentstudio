import {ContentWizardPanelParams} from './ContentWizardPanelParams';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {UrlAction} from '../UrlAction';
import {ContentId} from '../content/ContentId';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {AppBarTabId} from '@enonic/lib-admin-ui/app/bar/AppBarTabId';

export class ContentAppHelper {

    static DISPLAY_AS_NEW_PARAM: string = 'displayAsNew';

    static DISPLAY_AS_NEW: string = `${ContentAppHelper.DISPLAY_AS_NEW_PARAM}=true`;

    static LOCALIZED_PARAM: string = 'localized';

    static LOCALIZED: string = `${ContentAppHelper.LOCALIZED_PARAM}=true`;

    private static getContentWizardUrlPattern(action: string): string {
        return `(${CONFIG.getString('toolUri')})/(.+)/(${action})/.+$`;
    }

    static isContentWizardUrlMatch(action: string): boolean {
        const matchUrl = ContentAppHelper.getContentWizardUrlPattern(action);

        return new RegExp(matchUrl).test(window.location.pathname);
    }

    static isContentWizardUrl(): boolean {
        return ContentAppHelper.isContentWizardUrlMatch(`${UrlAction.EDIT}|${UrlAction.NEW}`);
    }

    static createWizardParamsFromUrl(): ContentWizardPanelParams {
        if (ContentAppHelper.isContentWizardUrlMatch(UrlAction.NEW)) {
            return ContentAppHelper.createWizardParamsForNew();
        }

        return ContentAppHelper.createWizardParamsForEdit();
    }

    private static getActionArguments(action: string): string[] {
        if (!ContentAppHelper.isContentWizardUrlMatch(action)) {
            throw Error(`Incorrect URL pattern for ${action}`);
        }

        const match = window.location.pathname.match(`(${action})/.+$`);
        if (!match[0]) {
            throw Error(`Missing arguments for ${action}`);
        }

        return match[0].split('/').slice(1);
    }

    private static createWizardParamsForNew(): ContentWizardPanelParams {
        const actionArguments: string[] = ContentAppHelper.getActionArguments(UrlAction.NEW);
        const contentTypeName: ContentTypeName = new ContentTypeName(actionArguments[0]);
        const tabId: AppBarTabId = AppBarTabId.forNew(contentTypeName.getApplicationKey().getName());
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
        const actionArguments: string[] = ContentAppHelper.getActionArguments(`${UrlAction.EDIT}`);

        const contentId = new ContentId(actionArguments[0]);
        const tabId: AppBarTabId = AppBarTabId.forEdit(contentId.toString());
        const displayAsNew: boolean = window.location.href.indexOf(ContentAppHelper.DISPLAY_AS_NEW) > 0;
        const isLocalized: boolean = window.location.href.indexOf(ContentAppHelper.LOCALIZED) > 0;

        return new ContentWizardPanelParams()
            .setContentId(contentId)
            .setTabId(tabId)
            .setDisplayAsNew(displayAsNew)
            .setLocalized(isLocalized);
    }
}
