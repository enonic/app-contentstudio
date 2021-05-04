import {ItemJson} from 'lib-admin-ui/item/ItemJson';
import {ThumbnailJson} from 'lib-admin-ui/thumb/ThumbnailJson';
import {ContentPublishTimeRangeJson} from 'lib-admin-ui/content/json/ContentPublishTimeRangeJson';
import {WorkflowJson} from 'lib-admin-ui/content/json/WorkflowJson';
import {ChildOrderJson} from '../resource/json/ChildOrderJson';

export interface ContentSummaryJson
    extends ItemJson {

    name: string;

    displayName: string;

    path: string;

    isRoot: boolean;

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
}
