import {type ItemJson} from '@enonic/lib-admin-ui/item/ItemJson';
import {type ThumbnailJson} from '@enonic/lib-admin-ui/thumb/ThumbnailJson';
import {type WorkflowJson} from '@enonic/lib-admin-ui/content/json/WorkflowJson';
import {type ChildOrderJson} from '../resource/json/ChildOrderJson';
import {type ContentPublishTimeRangeJson} from '../resource/json/ContentPublishTimeRangeJson';

export interface ContentSummaryJson
    extends ItemJson {

    name: string;

    displayName: string;

    path: string;

    hasChildren: boolean;

    type: string;

    iconUrl: string;

    thumbnail: ThumbnailJson;

    modifier: string;

    modifiedTime: string;

    createdTime: string;

    creator: string;

    archivedTime: string;

    archivedBy: string;

    owner: string;

    isPage: boolean;

    isValid: boolean;

    requireValid: boolean;

    childOrder: ChildOrderJson;

    publish: ContentPublishTimeRangeJson;

    language: string;

    contentState: string;

    workflow: WorkflowJson;

    inherit: string[];

    originProject: string;

    listTitle: string;

    originalParentPath: string;

    originalName: string;

    variantOf: string;
}
