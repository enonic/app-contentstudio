import { type Project } from '../../../../../../app/settings/data/project/Project';
import { createContent } from '../../../../../entities/content/api/createContent.api';
import { type ContentTypeName } from '../../../../../shared/lib/cms/schema/contentTypeName';
import { openEditContentTab } from '../../../../../shared/lib/url/navigation';
import { notifyError } from '../../../../../shared/notifications';

/**
 * Creates a content of the type in the root of the project and opens its wizard in a new tab, as
 * the legacy NewContentButton did. Resolves with the new id, or `undefined` once the error is notified.
 */
export async function addContentInProjectRoot(
    contentType: ContentTypeName,
    project: Readonly<Project>,
): Promise<string | undefined> {
    const result = await createContent({ contentType, projectName: project.getName() });

    return result.match(
        (content) => {
            openEditContentTab(content.getId(), { project: project.getName(), displayAsNew: true });
            return content.getId();
        },
        (error) => {
            notifyError(error.message);
            return undefined;
        },
    );
}
