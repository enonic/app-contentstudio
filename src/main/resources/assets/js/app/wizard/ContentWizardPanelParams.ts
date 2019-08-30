import '../../api.ts';
import {LayerContext} from '../layer/LayerContext';
import {ContentAppBarTabId} from '../ContentAppBarTabId';
import Application = api.app.Application;

export class ContentWizardPanelParams {

    application: Application;

    createSite: boolean = false;

    tabId: ContentAppBarTabId;

    contentTypeName: api.schema.content.ContentTypeName;

    parentContentId: api.content.ContentId;

    contentId: api.content.ContentId;

    setApplication(app: Application): ContentWizardPanelParams {
        this.application = app;
        return this;
    }

    setTabId(value: ContentAppBarTabId): ContentWizardPanelParams {
        this.tabId = value;
        return this;
    }

    setContentTypeName(value: api.schema.content.ContentTypeName): ContentWizardPanelParams {
        this.contentTypeName = value;
        return this;
    }

    setParentContentId(value: api.content.ContentId): ContentWizardPanelParams {
        this.parentContentId = value;
        return this;
    }

    setContentId(value: api.content.ContentId): ContentWizardPanelParams {
        this.contentId = value;
        return this;
    }

    setCreateSite(value: boolean): ContentWizardPanelParams {
        this.createSite = value;
        return this;
    }

    toString(): string {
        const layer: string = LayerContext.get().getCurrentLayer().getName();

        return this.tabId && this.tabId.getMode() === 'browse'
            ? this.tabId.getMode() + '/' + this.tabId.getId()
            : this.contentId
              ? `${layer}/${this.tabId.getMode()}/${this.contentId.toString()}`
              : `${layer}/new/${this.contentTypeName.toString()}` +
                     (this.parentContentId ? '/' + this.parentContentId.toString() : '');
    }
}
