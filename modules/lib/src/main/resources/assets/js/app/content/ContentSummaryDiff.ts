import {Diff} from '../Diff';

export interface InheritDiff extends Diff {
    content?: boolean;
    parent?: boolean;
    name?: boolean;
    sort?: boolean;
}

export interface ContentSummaryDiff extends Diff {
    id?: boolean;
    contentId?: boolean;
    name?: boolean;
    displayName?: boolean;
    inherit?: InheritDiff;
    path?: boolean;
    children?: boolean;
    type?: boolean;
    iconUrl?: boolean;
    thumbnail?: boolean;
    modifier?: boolean;
    owner?: boolean;
    page?: boolean;
    valid?: boolean;
    requireValid?: boolean;
    createdTime?: boolean;
    modifiedTime?: boolean;
    archivedTime?: boolean;
    archivedBy?: boolean;
    publishFromTime?: boolean;
    publishToTime?: boolean;
    publishFirstTime?: boolean;
    deletable?: boolean;
    editable?: boolean;
    childOrder?: boolean;
    language?: boolean;
    contentState?: boolean;
    workflow?: boolean;
    originalParentPath?: boolean;
    originalName?: boolean;
    variantOf?: boolean;
}
