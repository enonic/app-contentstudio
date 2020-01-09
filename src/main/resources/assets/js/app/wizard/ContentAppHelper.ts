import {ContentWizardPanelParams} from './ContentWizardPanelParams';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {AppBarTabId} from 'lib-admin-ui/app/bar/AppBarTabId';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {Application} from 'lib-admin-ui/app/Application';


export class ContentAppHelper {

    static isContentWizard(app: Application): boolean {
        const path: Path = app.getPath();
        const action: string = path.getElement(1);

        return action === 'new' || action === 'edit';
    }

    static createWizardParamsFromApp(app: Application): ContentWizardPanelParams {
        const path: Path = app.getPath();
        const action: string = path.getElement(1);

        if (action === 'new') {
            return ContentAppHelper.createWizardParamsForNew(app);
        }

        return ContentAppHelper.createWizardParamsForEdit(app);
    }

    private static createWizardParamsForNew(app: Application): ContentWizardPanelParams {
        const path: Path = app.getPath();
        const contentTypeName: ContentTypeName = new ContentTypeName(path.getElement(2));
        const tabId: AppBarTabId = AppBarTabId.forNew(contentTypeName.getApplicationKey().getName());
        let parentContentId;
        if (path.getElement(3)) {
            parentContentId = new ContentId(path.getElement(3));
        }

        return new ContentWizardPanelParams()
            .setApplication(app)
            .setContentTypeName(contentTypeName)
            .setParentContentId(parentContentId)
            .setCreateSite(contentTypeName.isSite())
            .setTabId(tabId);
    }

    private static createWizardParamsForEdit(app: Application): ContentWizardPanelParams {
        const path: Path = app.getPath();
        const contentId = new ContentId(!!path.getElement(2) ? path.getElement(2) : path.getElement(1));
        const tabId: AppBarTabId = AppBarTabId.forEdit(contentId.toString());

        return new ContentWizardPanelParams()
            .setApplication(app)
            .setContentId(contentId)
            .setTabId(tabId);
    }

}
