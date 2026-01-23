import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentData} from '../../../views/browse/grid/ContentData';
import {calcWorkflowStateStatus} from './workflow';
import {resolveDisplayName, resolveSubName} from './prettify';


export function toContentData(item: ContentSummaryAndCompareStatus): ContentData {
    return {
        ...toContentProps(item),
        hasChildren: item.hasChildren(),
    }
}

export function toContentProps(item: ContentSummaryAndCompareStatus): Omit<ContentData, 'path' | 'children'> {
    return {
        id: item.getId().toString(),
        displayName: resolveDisplayName(item),
        name: resolveSubName(item),
        hasChildren: item.hasChildren(),
        contentType: item.getType(),
        publishStatus: item.getPublishStatus(),
        workflowStatus: calcWorkflowStateStatus(item.getContentSummary()),
        iconUrl: item.getContentSummary().getIconUrl(),
        item, // temporary, for backward compatibility
    }
}
