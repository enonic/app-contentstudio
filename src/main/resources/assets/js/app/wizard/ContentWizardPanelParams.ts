import {AppBarTabId} from 'lib-admin-ui/app/bar/AppBarTabId';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {Application} from 'lib-admin-ui/app/Application';

export class ContentWizardPanelParams {

    application: Application;

    createSite: boolean = false;

    tabId: AppBarTabId;

    contentTypeName: ContentTypeName;

    parentContentId: ContentId;

    contentId: ContentId;

    setApplication(app: Application): ContentWizardPanelParams {
        this.application = app;
        return this;
    }

    setTabId(value: AppBarTabId): ContentWizardPanelParams {
        this.tabId = value;
        return this;
    }

    setContentTypeName(value: ContentTypeName): ContentWizardPanelParams {
        this.contentTypeName = value;
        return this;
    }

    setParentContentId(value: ContentId): ContentWizardPanelParams {
        this.parentContentId = value;
        return this;
    }

    setContentId(value: ContentId): ContentWizardPanelParams {
        this.contentId = value;
        return this;
    }

    setCreateSite(value: boolean): ContentWizardPanelParams {
        this.createSite = value;
        return this;
    }

    toString(): string {

        return this.tabId && this.tabId.getMode() === 'browse'
            ? this.tabId.getMode() + '/' + this.tabId.getId()
            : this.contentId
                   ? 'edit/' + this.contentId.toString()
                   : 'new/' + this.contentTypeName.toString() +
                     (this.parentContentId ? '/' + this.parentContentId.toString() : '');
    }

    static fromApp(app: Application): ContentWizardPanelParams {
        let path = app.getPath();
        let tabId;
        let wizardParams;
        switch (path.getElement(0)) {
        case 'new':
            let contentTypeName = new ContentTypeName(path.getElement(1));
            let parentContentId;
            if (path.getElement(2)) {
                parentContentId = new ContentId(path.getElement(2));
            }
            tabId = AppBarTabId.forNew(contentTypeName.getApplicationKey().getName());
            wizardParams = new ContentWizardPanelParams()
                .setApplication(app)
                .setContentTypeName(contentTypeName)
                .setParentContentId(parentContentId)
                .setCreateSite(contentTypeName.isSite())
                .setTabId(tabId);
            break;
        case 'edit':
            let contentId = new ContentId(path.getElement(1));
            tabId = AppBarTabId.forEdit(contentId.toString());
            wizardParams = new ContentWizardPanelParams()
                .setApplication(app)
                .setContentId(contentId)
                .setTabId(tabId);
            break;
        }
        return wizardParams;
    }
}
