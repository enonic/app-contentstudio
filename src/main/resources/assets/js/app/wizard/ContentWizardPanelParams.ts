import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {Application} from 'lib-admin-ui/app/Application';
import {ContentAppBarTabId} from '../ContentAppBarTabId';
import {Project} from '../settings/data/project/Project';
import {ProjectContext} from '../project/ProjectContext';

export class ContentWizardPanelParams {

    application: Application;

    createSite: boolean = false;

    tabId: ContentAppBarTabId;

    contentTypeName: ContentTypeName;

    parentContentId: ContentId;

    contentId: ContentId;

    project: Project;

    constructor() {
        this.project = ProjectContext.get().getProject();
    }

    setApplication(app: Application): ContentWizardPanelParams {
        this.application = app;
        return this;
    }

    setTabId(value: ContentAppBarTabId): ContentWizardPanelParams {
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

    setProject(value: Project): ContentWizardPanelParams {
        this.project = value;
        return this;
    }

}
