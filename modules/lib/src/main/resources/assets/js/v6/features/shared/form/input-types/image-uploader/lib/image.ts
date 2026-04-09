import {type ContentId} from '../../../../../../../app/content/ContentId';
import {type Project} from '../../../../../../../app/settings/data/project/Project';
import {ImageUrlResolver} from '../../../../../../../app/util/ImageUrlResolver';

export function getImageUrl(contentId: ContentId, project: Readonly<Project>): string {
    return new ImageUrlResolver(null, project)
        .setContentId(contentId)
        .setTimestamp(new Date())
        .disableCropping()
        .disableProcessing()
        .resolveForPreview();
}
