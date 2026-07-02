import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentData } from '../../../entities/content/model/ContentData';
import { calcTreePublishStatus } from '../../../shared/lib/cms/content/status';
import { calcContentState } from '../../../shared/lib/cms/content/workflow';
import { resolveDisplayName, resolveSubName } from '../../../shared/lib/cms/content/prettify';

export function toContentData(item: ContentSummary): ContentData {
    return {
        ...toContentProps(item),
        hasChildren: item.hasChildren(),
    };
}

export function toContentProps(item: ContentSummary): Omit<ContentData, 'path' | 'children'> {
    return {
        id: item.getId().toString(),
        displayName: resolveDisplayName(item),
        name: resolveSubName(item),
        hasChildren: item.hasChildren(),
        contentType: item.getType(),
        publishStatus: calcTreePublishStatus(item),
        contentState: calcContentState(item),
        iconUrl: item.getIconUrl(),
        item,
    };
}
