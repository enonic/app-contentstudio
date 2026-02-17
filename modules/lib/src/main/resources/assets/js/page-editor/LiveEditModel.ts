import {type CompareStatus} from '../app/content/CompareStatus';
import {type Content} from '../app/content/Content';
import {type ContentFormContext} from '../app/ContentFormContext';
import {ContentSummaryAndCompareStatus} from '../app/content/ContentSummaryAndCompareStatus';
import {ContentSummaryBuilder} from '../app/content/ContentSummary';
import {type DefaultModels} from '../app/wizard/page/DefaultModels';
import {PageState} from '../app/wizard/page/PageState';
import {type SiteModel} from '../app/site/SiteModel';

export class LiveEditModel {

    private readonly siteModel: SiteModel;

    private readonly content: Content;

    private readonly compareStatus: CompareStatus;

    private readonly formContext: ContentFormContext;

    private readonly defaultModels: DefaultModels;

    constructor(builder: LiveEditModelBuilder) {
        this.siteModel = builder.siteModel;
        this.content = builder.content;
        this.formContext = builder.formContext;
        this.defaultModels = builder.defaultModels;
        this.compareStatus = builder.compareStatus;
    }

    getFormContext(): ContentFormContext {
        return this.formContext;
    }

    getContent(): Content {
        return this.content;
    }

    getCompareStatus(): CompareStatus {
        return this.compareStatus;
    }

    getContentSummaryAndCompareStatus() {
        return ContentSummaryAndCompareStatus.fromContentAndCompareStatus(new ContentSummaryBuilder(this.content).build(),
            this.compareStatus);
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

    compareStatus: CompareStatus;

    setCompareStatus(value: CompareStatus): LiveEditModelBuilder {
        this.compareStatus = value;
        return this;
    }

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
