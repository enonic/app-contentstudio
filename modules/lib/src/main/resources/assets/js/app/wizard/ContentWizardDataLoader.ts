import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
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
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {Exception, ExceptionType} from '@enonic/lib-admin-ui/Exception';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ProjectContext} from '../project/ProjectContext';
import {ContentsExistRequest} from '../resource/ContentsExistRequest';
import {ContentsExistResult} from '../resource/ContentsExistResult';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';

export class ContentWizardDataLoader {

    parentContent: Content;

    content: Content;

    contentType: ContentType;

    siteContent: Site;

    defaultModels: DefaultModels;

    compareStatus: CompareStatus;

    publishStatus: PublishStatus;

    contentExistsInParentProject: boolean;

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
            return ContentWizardDataLoader.loadDefaultModels(this.siteContent, params.contentTypeName);

        }).then((defaultModels: DefaultModels) => {

            this.defaultModels = defaultModels;
            return this;

        });
    }

    private loadDataForEdit(params: ContentWizardPanelParams): Q.Promise<ContentWizardDataLoader> {
        const sitePromise: Q.Promise<void> = this.loadSite(params.contentId).then((loadedSite: Site) => {
            this.siteContent = loadedSite;
            return Q(null);
        });

        const contentPromise: Q.Promise<void> = this.loadContent(params.contentId).then((loadedContent: Content) => {
            this.content = loadedContent;
            return Q(null);
        });

        const modelsPromise: Q.Promise<void> = Q.all([sitePromise, contentPromise]).then(() => {
            return ContentWizardDataLoader.loadDefaultModels(this.siteContent, this.content.getType()).then((defaultModels) => {
                this.defaultModels = defaultModels;
                return Q(null);
            });
        });

        const otherPromises: Q.Promise<void> = contentPromise.then(() => {
            const parentPromise: Q.Promise<Content> = this.loadParentContent(params, false);
            const typePromise: Q.Promise<ContentType> = this.loadContentType(this.content.getType());
            const statusPromise: Q.Promise<ContentSummaryAndCompareStatus> =
                new ContentSummaryAndCompareStatusFetcher().fetchByContent(this.content);
            const parentProjectContentExistsPromise: Q.Promise<boolean> = this.loadParentProjectItemIfExists();

            return Q.all([parentPromise, typePromise, statusPromise, parentProjectContentExistsPromise]).spread(
                (parentContent, contentType, compareStatus, existsInParentProject) => {
                    this.parentContent = parentContent;
                    this.contentType = contentType;
                    this.contentExistsInParentProject = existsInParentProject;

                    if (compareStatus) {
                        this.compareStatus = compareStatus.getCompareStatus();
                        this.publishStatus = compareStatus.getPublishStatus();
                    }

                    return Q(null);
                });
        });

        return Q.all([modelsPromise, otherPromises]).then(() => {
            return this;
        });
    }

    private loadContent(contentId: ContentId): Q.Promise<Content> {
        return new GetContentByIdRequest(contentId).sendAndParse();
    }

    private loadContentType(name: ContentTypeName): Q.Promise<ContentType> {
        let deferred = Q.defer<ContentType>();
        new GetContentTypeByNameRequest(name).sendAndParse().then((contentType) => {
            deferred.resolve(contentType);
        }).catch((reason) => {
            const msg = i18n('notify.wizard.noContentType', name.toString());
            NotifyManager.get().showWarning(msg);
            deferred.resolve(null);
        }).done();
        return deferred.promise;
    }

    public loadSite(contentId: ContentId): Q.Promise<Site> {
        return contentId ? new GetNearestSiteRequest(contentId).sendAndParse() : Q<Site>(null);
    }

    public static loadDefaultModels(site: Site, contentType: ContentTypeName): Q.Promise<DefaultModels> {
        if (site) {
            return DefaultModelsFactory.create({
                siteId: site.getContentId(),
                contentType: contentType,
            } as DefaultModelsFactoryConfig);
        } else if (contentType.isSite()) {
            return Q<DefaultModels>(new DefaultModels(null));
        } else {
            return Q<DefaultModels>(null);
        }
    }

    private loadParentContent(params: ContentWizardPanelParams, isNew: boolean = true): Q.Promise<Content> {
        if (!isNew && !this.content.hasParent() ||
            isNew && params.parentContentId == null) {
            return Q<Content>(null);
        } else if (this.content) {
            return new GetContentByPathRequest(this.content.getPath().getParentPath()).sendAndParse();
        } else if (params.parentContentId) {
            return new GetContentByIdRequest(params.parentContentId).sendAndParse();
        }
    }

    private loadParentProjectItemIfExists(): Q.Promise<boolean> {
        // TODO: Projects. Fix. May calculate to invalid project
        const parentProjectName: string = ProjectContext.get().getProject().getMainParent();

        if (!parentProjectName) {
            return Q(false);
        }

        const id: string = this.content.getId();

        return new ContentsExistRequest([id])
            .setRequestProjectName(parentProjectName)
            .sendAndParse()
            .then((result: ContentsExistResult) => !!result.getContentsExistMap()[id]);
    }
}
