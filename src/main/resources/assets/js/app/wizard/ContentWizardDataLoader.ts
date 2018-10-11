import {DefaultModels} from './page/DefaultModels';
import {DefaultModelsFactory, DefaultModelsFactoryConfig} from './page/DefaultModelsFactory';
import {ContentWizardPanelParams} from './ContentWizardPanelParams';
import {GetContentTypeByNameRequest} from '../resource/GetContentTypeByNameRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {GetContentByPathRequest} from '../resource/GetContentByPathRequest';
import {GetNearestSiteRequest} from '../resource/GetNearestSiteRequest';
import {Content} from '../content/Content';
import {Site} from '../content/Site';
import {CompareStatus} from '../content/CompareStatus';
import {PublishStatus} from '../publish/PublishStatus';
import ContentId = api.content.ContentId;
import ContentTypeName = api.schema.content.ContentTypeName;
import ContentType = api.schema.content.ContentType;
import i18n = api.util.i18n;

export class ContentWizardDataLoader {

    parentContent: Content;

    content: Content;

    contentType: ContentType;

    siteContent: Site;

    defaultModels: DefaultModels;

    compareStatus: CompareStatus;

    publishStatus: PublishStatus;

    loadData(params: ContentWizardPanelParams): wemQ.Promise<ContentWizardDataLoader> {
        if (!params.contentId) {
            return this.loadDataForNew(params);
        } else {
            return this.loadDataForEdit(params);
        }
    }

    private loadDataForNew(params: ContentWizardPanelParams): wemQ.Promise<ContentWizardDataLoader> {

        return this.loadContentType(params.contentTypeName).then((loadedContentType: ContentType) => {

            this.contentType = loadedContentType;
            return this.loadParentContent(params, true);

        }).then((loadedParentContent: Content) => {

            this.parentContent = loadedParentContent;
            return this.loadSite(loadedParentContent ? loadedParentContent.getContentId() : null);

        }).then((loadedSite: Site) => {

            this.siteContent = loadedSite;
            return this.loadDefaultModels(this.siteContent, params.contentTypeName);

        }).then((defaultModels: DefaultModels) => {

            this.defaultModels = defaultModels;
            return this;

        });
    }

    private loadDataForEdit(params: ContentWizardPanelParams): wemQ.Promise<ContentWizardDataLoader> {

        let sitePromise = this.loadSite(params.contentId).then((loadedSite: Site) => {
            this.siteContent = loadedSite;
        });

        let contentPromise = this.loadContent(params.contentId).then((loadedContent: Content) => {
            this.content = loadedContent;
        });

        let modelsPromise = wemQ.all([sitePromise, contentPromise]).then(() => {
            return this.loadDefaultModels(this.siteContent, this.content.getType()).then((defaultModels) => {
                this.defaultModels = defaultModels;
            });
        });

        let otherPromises = contentPromise.then(() => {
            let parentPromise = this.loadParentContent(params, false);
            let typePromise = this.loadContentType(this.content.getType());
            let statusPromise = ContentSummaryAndCompareStatusFetcher.fetchByContent(this.content);

            return wemQ.all([parentPromise, typePromise, statusPromise]).spread((parentContent, contentType, compareStatus) => {
                this.parentContent = parentContent;
                this.contentType = contentType;
                if (compareStatus) {
                    this.compareStatus = compareStatus.getCompareStatus();
                    this.publishStatus = compareStatus.getPublishStatus();
                }
            });
        });

        return wemQ.all([modelsPromise, otherPromises]).then(() => {
            return this;
        });
    }

    private loadContent(contentId: ContentId): wemQ.Promise<Content> {
        /*        if (api.ObjectHelper.iFrameSafeInstanceOf(contentId, Content)) {
         return wemQ(<Content> contentId);
         } else {*/
        return new GetContentByIdRequest(contentId).sendAndParse();
        // }
    }

    private loadContentType(name: ContentTypeName): wemQ.Promise<ContentType> {
        let deferred = wemQ.defer<ContentType>();
        new GetContentTypeByNameRequest(name).sendAndParse().then((contentType) => {
            deferred.resolve(contentType);
        }).catch((reason) => {
            const msg = i18n('notify.wizard.noContentType', name.toString());
            deferred.reject(new api.Exception(msg, api.ExceptionType.WARNING));
        }).done();
        return deferred.promise;
    }

    public loadSite(contentId: ContentId): wemQ.Promise<Site> {
        return contentId ? new GetNearestSiteRequest(contentId).sendAndParse() : wemQ<Site>(null);
    }

    public loadDefaultModels(site: Site, contentType: ContentTypeName): wemQ.Promise<DefaultModels> {

        if (site) {
            return DefaultModelsFactory.create(<DefaultModelsFactoryConfig>{
                siteId: site.getContentId(),
                contentType: contentType,
                applications: site.getApplicationKeys()
            });
        } else if (contentType.isSite()) {
            return wemQ<DefaultModels>(new DefaultModels(null, null));
        } else {
            return wemQ<DefaultModels>(null);
        }
    }

    private loadParentContent(params: ContentWizardPanelParams, isNew: boolean = true): wemQ.Promise<Content> {
        /*
         if (api.ObjectHelper.iFrameSafeInstanceOf(params.parentContentId, Content)) {
         return wemQ(<Content> params.parentContentId);
         }*/

        if (!isNew && !this.content.hasParent() ||
            isNew && params.parentContentId == null) {
            return wemQ<Content>(null);

        } else if (this.content) {
            return new GetContentByPathRequest(this.content.getPath().getParentPath()).sendAndParse();

        } else if (params.parentContentId) {
            return new GetContentByIdRequest(params.parentContentId).sendAndParse();
        }
    }

}
