import {ItemJson} from 'lib-admin-ui/item/ItemJson';
import {ThumbnailJson} from 'lib-admin-ui/thumb/ThumbnailJson';
import {WorkflowJson} from 'lib-admin-ui/content/json/WorkflowJson';
import {ChildOrderJson} from '../resource/json/ChildOrderJson';
import {ContentPublishTimeRangeJson} from '../resource/json/ContentPublishTimeRangeJson';

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
}
