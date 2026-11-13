import type { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type { CompareStatus } from '../../../../app/content/CompareStatus';
import type { Content } from '../../../../app/content/Content';
import type { ContentId } from '../../../../app/content/ContentId';
import type { Site } from '../../../../app/content/Site';
import type { ContentType } from '../../../../app/inputtype/schema/ContentType';
import type { PublishStatus } from '../../../../app/publish/PublishStatus';
import { ContentsExistRequest } from '../../../../app/resource/ContentsExistRequest';
import { ContentSummaryAndCompareStatusFetcher } from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import { GetContentByIdRequest } from '../../../../app/resource/GetContentByIdRequest';
import { GetContentByPathRequest } from '../../../../app/resource/GetContentByPathRequest';
import { GetContentTypeByNameRequest } from '../../../../app/resource/GetContentTypeByNameRequest';
import { GetNearestSiteRequest } from '../../../../app/resource/GetNearestSiteRequest';
import { DefaultModels } from '../../../../app/wizard/page/DefaultModels';
import { DefaultModelsFactory } from '../../../../app/wizard/page/DefaultModelsFactory';
import { getActiveProject } from '../../../entities/project/activeProject.store';
import { i18n } from '../../../shared/i18n';
import { notifyWarning } from '../../../shared/notifications';

//
// * Wizard Load Service
//
// Loads what the wizard needs before it renders: the content with its type,
// parent and nearest site, the default page models and the publish status.
//

export type WizardLoadParams = {
    contentId?: ContentId;
    contentTypeName?: ContentTypeName;
    parentContentId?: ContentId;
};

export type WizardLoadedData = {
    /** Absent for new content, which the wizard creates after loading. */
    content?: Content;
    contentType: ContentType | null;
    parentContent: Content | null;
    site: Site | null;
    defaultModels: DefaultModels | null;
    compareStatus?: CompareStatus;
    publishStatus?: PublishStatus;
    existsInParentProject: boolean;
};

async function loadContentType(name: ContentTypeName): Promise<ContentType | null> {
    try {
        return await new GetContentTypeByNameRequest(name).sendAndParse();
    } catch {
        notifyWarning(i18n('notify.wizard.noContentType', name.toString()));
        return null;
    }
}

export async function loadNearestSite(contentId: ContentId | null | undefined): Promise<Site | null> {
    return contentId ? await new GetNearestSiteRequest(contentId).sendAndParse() : null;
}

export async function loadDefaultModels(
    site: Site | null,
    contentType: ContentTypeName,
): Promise<DefaultModels | null> {
    if (site) return await DefaultModelsFactory.create({ siteId: site.getContentId(), contentType });

    return contentType.isSite() ? new DefaultModels(null) : null;
}

async function existsInParentProject(content: Content): Promise<boolean> {
    // TODO: Projects. Fix. May calculate to invalid project
    const parentProjectName = getActiveProject().getMainParent();
    if (!parentProjectName) return false;

    const id = content.getId();
    const result = await new ContentsExistRequest([id]).setRequestProjectName(parentProjectName).sendAndParse();

    return !!result.getContentsExistMap().get(id);
}

async function loadForNew(contentTypeName: ContentTypeName, parentContentId?: ContentId): Promise<WizardLoadedData> {
    const contentType = await loadContentType(contentTypeName);
    const parentContent = parentContentId ? await new GetContentByIdRequest(parentContentId).sendAndParse() : null;
    const site = await loadNearestSite(parentContent?.getContentId());
    const defaultModels = await loadDefaultModels(site, contentTypeName);

    return { contentType, parentContent, site, defaultModels, existsInParentProject: false };
}

async function loadForEdit(contentId: ContentId): Promise<WizardLoadedData> {
    const sitePromise = loadNearestSite(contentId);
    const contentPromise: Promise<Content> = Promise.resolve(new GetContentByIdRequest(contentId).sendAndParse());

    const modelsPromise = Promise.all([sitePromise, contentPromise]).then(([site, content]) =>
        loadDefaultModels(site, content.getType()),
    );

    const detailsPromise = contentPromise.then((content) =>
        Promise.all([
            content.hasParent() ? new GetContentByPathRequest(content.getPath().getParentPath()).sendAndParse() : null,
            loadContentType(content.getType()),
            new ContentSummaryAndCompareStatusFetcher().fetchByContent(content),
            existsInParentProject(content),
        ]),
    );

    const [content, site, defaultModels, [parentContent, contentType, status, inParentProject]] = await Promise.all([
        contentPromise,
        sitePromise,
        modelsPromise,
        detailsPromise,
    ]);

    return {
        content,
        contentType,
        parentContent,
        site,
        defaultModels,
        compareStatus: status?.getCompareStatus(),
        publishStatus: status?.getPublishStatus(),
        existsInParentProject: inParentProject,
    };
}

export async function loadWizardData(params: WizardLoadParams): Promise<WizardLoadedData> {
    return params.contentId
        ? await loadForEdit(params.contentId)
        : await loadForNew(params.contentTypeName, params.parentContentId);
}
