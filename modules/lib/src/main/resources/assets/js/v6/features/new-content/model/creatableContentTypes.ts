import { AuthHelper } from '@enonic/lib-admin-ui/auth/AuthHelper';
import { type ContentId } from '../../../../app/content/ContentId';
import { type Project } from '../../../../app/settings/data/project/Project';
import { ProjectHelper } from '../../../../app/settings/data/project/ProjectHelper';
import { type ContentTypeSummary, fetchCreatableContentTypes } from '../../../entities/schema';
import { CONTENT_TYPE } from '../../../shared/lib/cms/schema/contentTypeName';

export type CreatableContentTypesOptions = {
    contentId?: ContentId;
    allowedContentTypes?: string[];
    project?: Readonly<Project>;
};

export async function loadCreatableContentTypes({
    contentId,
    allowedContentTypes,
    project,
}: CreatableContentTypesOptions): Promise<ContentTypeSummary[]> {
    const result = await fetchCreatableContentTypes({
        contentId,
        allowedContentTypes,
        projectName: project?.getName(),
    });

    if (result.isErr()) throw result.error;

    const canCreateSites = AuthHelper.isContentAdmin() || (await ProjectHelper.isUserProjectOwner(project));

    return canCreateSites ? result.value : result.value.filter((type) => type.name !== CONTENT_TYPE.SITE);
}
