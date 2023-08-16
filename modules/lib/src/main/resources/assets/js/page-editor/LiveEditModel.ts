import {SiteModel} from '../app/site/SiteModel';
import {ContentFormContext} from '../app/ContentFormContext';
import {Content} from '../app/content/Content';
import {PageState} from '../app/wizard/page/PageState';
import {DefaultModels} from '../app/wizard/page/DefaultModels';

export class LiveEditModel {

    private readonly siteModel: SiteModel;

    private readonly content: Content;

    private readonly formContext: ContentFormContext;

    private readonly defaultModels: DefaultModels;

    constructor(builder: LiveEditModelBuilder) {
        this.siteModel = builder.siteModel;
        this.content = builder.content;
        this.formContext = builder.formContext;
        this.defaultModels = builder.defaultModels;
    }

    getFormContext(): ContentFormContext {
        return this.formContext;
    }

    getContent(): Content {
        return this.content;
    }

    getSiteModel(): SiteModel {
        return this.siteModel;
    }

    isRenderableContent(): boolean {
        const hasApplications: boolean = this.siteModel.getApplicationKeys().length > 0;

        return hasApplications || PageState.getState()?.hasController() || !!this.defaultModels?.getDefaultPageTemplate();
    }

    isFragmentAllowed(): boolean {
        if (this.content.getType().isFragment()) {
            return false;
        }

        if (this.content.getType().isPageTemplate()) {
            return false;
        }

        return true;
    }

    getDefaultModels(): DefaultModels {
        return this.defaultModels;
    }

    static create(): LiveEditModelBuilder {
        return new LiveEditModelBuilder();
    }
}

export class LiveEditModelBuilder {

    siteModel: SiteModel;

    content: Content;

    formContext: ContentFormContext;

    defaultModels: DefaultModels;

    setSiteModel(value: SiteModel): LiveEditModelBuilder {
        this.siteModel = value;
        return this;
    }

    setContent(value: Content): LiveEditModelBuilder {
        this.content = value;
        return this;
    }

    setContentFormContext(value: ContentFormContext): LiveEditModelBuilder {
        this.formContext = value;
        return this;
    }

    setDefaultTemplate(value: DefaultModels): LiveEditModelBuilder {
        this.defaultModels = value;
        return this;
    }

    build(): LiveEditModel {
        return new LiveEditModel(this);
    }
}
