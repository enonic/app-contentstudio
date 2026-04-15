import {type ContentSummary} from '../../../../../app/content/ContentSummary';
import {type ContentData} from '../../../views/browse/grid/ContentData';
import {calcTreePublishStatus} from './status';
import {calcContentState} from './workflow';
import {resolveDisplayName, resolveSubName} from './prettify';


export function toContentData(item: ContentSummary): ContentData {
    return {
        ...toContentProps(item),
        hasChildren: item.hasChildren(),
    }
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
    }
}
