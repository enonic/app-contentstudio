import { isContentAdmin } from '../../../shared/lib/cms/security/auth';
import { type ContentId } from '../../../../app/content/ContentId';
import { type Project } from '../../../../app/settings/data/project/Project';
import { ProjectHelper } from '../../../../app/settings/data/project/ProjectHelper';
import { type ContentTypeSummary, fetchCreatableContentTypes } from '../../../entities/schema';
import { type ApplicationKey } from '../../../shared/lib/cms/application/applicationKey';
import { CONTENT_TYPE } from '../../../shared/lib/cms/schema/contentTypeName';

export type CreatableContentTypesOptions = {
    contentId?: ContentId;
    allowedContentTypes?: string[];
    /** Resolves `${app}` in the allowed patterns when there is no content. */
    applicationKey?: ApplicationKey;
    project?: Readonly<Project>;
};

export async function loadCreatableContentTypes({
    contentId,
    allowedContentTypes,
    applicationKey,
    project,
}: CreatableContentTypesOptions): Promise<ContentTypeSummary[]> {
    const result = await fetchCreatableContentTypes({
        contentId,
        allowedContentTypes,
        applicationKey,
        projectName: project?.getName(),
    });

    if (result.isErr()) throw result.error;

    const canCreateSites = isContentAdmin() || (await ProjectHelper.isUserProjectOwner(project));

    return canCreateSites ? result.value : result.value.filter((type) => type.name !== CONTENT_TYPE.SITE);
}
