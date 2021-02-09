import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentId} from 'lib-admin-ui/content/ContentId';
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
import {ContentType} from '../inputtype/schema/ContentType';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {Exception, ExceptionType} from 'lib-admin-ui/Exception';

export class ContentWizardDataLoader {

    parentContent: Content;

    content: Content;

    contentType: ContentType;

    siteContent: Site;

    defaultModels: DefaultModels;

    compareStatus: CompareStatus;

    publishStatus: PublishStatus;

    loadData(params: ContentWizardPanelParams): Q.Promise<ContentWizardDataLoader> {
        if (!params.contentId) {
            return this.loadDataForNew(params);
        } else {
            return this.loadDataForEdit(params);
        }
    }

    private loadDataForNew(params: ContentWizardPanelParams): Q.Promise<ContentWizardDataLoader> {

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

    private loadDataForEdit(params: ContentWizardPanelParams): Q.Promise<ContentWizardDataLoader> {

        let sitePromise = this.loadSite(params.contentId).then((loadedSite: Site) => {
            this.siteContent = loadedSite;
        });

        let contentPromise = this.loadContent(params.contentId).then((loadedContent: Content) => {
            this.content = loadedContent;
        });

        let modelsPromise = Q.all([sitePromise, contentPromise]).then(() => {
            return this.loadDefaultModels(this.siteContent, this.content.getType()).then((defaultModels) => {
                this.defaultModels = defaultModels;
            });
        });

        let otherPromises = contentPromise.then(() => {
            let parentPromise = this.loadParentContent(params, false);
            let typePromise = this.loadContentType(this.content.getType());
            let statusPromise = ContentSummaryAndCompareStatusFetcher.fetchByContent(this.content);

            return Q.all([parentPromise, typePromise, statusPromise]).spread((parentContent, contentType, compareStatus) => {
                this.parentContent = parentContent;
                this.contentType = contentType;
                if (compareStatus) {
                    this.compareStatus = compareStatus.getCompareStatus();
                    this.publishStatus = compareStatus.getPublishStatus();
                }
            });
        });

        return Q.all([modelsPromise, otherPromises]).then(() => {
            return this;
        });
    }

    private loadContent(contentId: ContentId): Q.Promise<Content> {
        /*        if (ObjectHelper.iFrameSafeInstanceOf(contentId, Content)) {
         return Q(<Content> contentId);
         } else {*/
        return new GetContentByIdRequest(contentId).sendAndParse();
        // }
    }

    private loadContentType(name: ContentTypeName): Q.Promise<ContentType> {
        let deferred = Q.defer<ContentType>();
        new GetContentTypeByNameRequest(name).sendAndParse().then((contentType) => {
            deferred.resolve(contentType);
        }).catch((reason) => {
            const msg = i18n('notify.wizard.noContentType', name.toString());
            deferred.reject(new Exception(msg, ExceptionType.WARNING));
        }).done();
        return deferred.promise;
    }

    public loadSite(contentId: ContentId): Q.Promise<Site> {
        return contentId ? new GetNearestSiteRequest(contentId).sendAndParse() : Q<Site>(null);
    }

    public loadDefaultModels(site: Site, contentType: ContentTypeName): Q.Promise<DefaultModels> {

        if (site) {
            return DefaultModelsFactory.create(<DefaultModelsFactoryConfig>{
                siteId: site.getContentId(),
                contentType: contentType,
                applications: site.getApplicationKeys()
            });
        } else if (contentType.isSite()) {
            return Q<DefaultModels>(new DefaultModels(null, null));
        } else {
            return Q<DefaultModels>(null);
        }
    }

    private loadParentContent(params: ContentWizardPanelParams, isNew: boolean = true): Q.Promise<Content> {
        /*
         if (ObjectHelper.iFrameSafeInstanceOf(params.parentContentId, Content)) {
         return Q(<Content> params.parentContentId);
         }*/

        if (!isNew && !this.content.hasParent() ||
            isNew && params.parentContentId == null) {
            return Q<Content>(null);

        } else if (this.content) {
            return new GetContentByPathRequest(this.content.getPath().getParentPath()).sendAndParse();

        } else if (params.parentContentId) {
            return new GetContentByIdRequest(params.parentContentId).sendAndParse();
        }
    }

}
