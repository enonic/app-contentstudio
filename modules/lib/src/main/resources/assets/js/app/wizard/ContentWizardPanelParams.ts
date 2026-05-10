import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type Application} from '@enonic/lib-admin-ui/app/Application';
import {type ContentId} from '../content/ContentId';
import {type WizardPanelParams} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {type Content} from '../content/Content';
import {type AppBarTabId} from '@enonic/lib-admin-ui/app/bar/AppBarTabId';

export class ContentWizardPanelParams implements WizardPanelParams<Content> {

    application: Application;

    createSite: boolean = false;

    tabId: AppBarTabId;

    contentTypeName: ContentTypeName;

    parentContentId: ContentId;

    contentId: ContentId;

    projectName: string | undefined;

    localized: boolean = false;

    displayAsNew: boolean = false;

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

    setProjectName(value: string | undefined): ContentWizardPanelParams {
        this.projectName = value;
        return this;
    }

    setLocalized(value: boolean): ContentWizardPanelParams {
        this.localized = value;
        return this;
    }

    setDisplayAsNew(value: boolean): ContentWizardPanelParams {
        this.displayAsNew = value;
        return this;
    }

}
