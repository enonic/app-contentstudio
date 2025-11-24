import {toCS6ContentStatus} from '../../../../../app/content/ContentStatus';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentData} from '../../../views/browse/grid/ContentData';
import {calcWorkflowStateStatus, resolveDisplayName, resolveSubName} from './workflow';


export function toContentData(item: ContentSummaryAndCompareStatus, path: string[] = [], children?: ContentData[]): ContentData {
    return {
        ...toContentProps(item),
        path,
        children,
    }
}

export function toContentProps(item: ContentSummaryAndCompareStatus): Pick<ContentData, 'id' | 'displayName' | 'name' | 'hasChildren' | 'contentType' | 'workflowStatus' | 'iconUrl' | 'contentStatus' | 'item'> {
    return {
        id: item.getId().toString(),
        displayName: resolveDisplayName(item),
        name: resolveSubName(item),
        hasChildren: item.hasChildren(),
        contentType: item.getType(),
        workflowStatus: calcWorkflowStateStatus(item.getContentSummary()),
        iconUrl: item.getContentSummary().getIconUrl(),
        contentStatus: toCS6ContentStatus(item.getContentState()),
        item, // temporary, for backward compatibility
    }
}
