import { type ContentId } from '../../../../../../../app/content/ContentId';
import { type Project } from '../../../../../../../app/settings/data/project/Project';
import { buildImagePreviewUrl } from '../../../../../../shared/lib/url/images';

export function getImageUrl(contentId: ContentId, project: Readonly<Project>): string {
    return buildImagePreviewUrl({
        contentId: contentId.toString(),
        projectName: project?.getName(),
        timestamp: new Date(),
        source: true,
        crop: false,
    });
}
