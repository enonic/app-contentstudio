import {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';

export interface EnonicAiAppliedData {
    displayName?: string;
    propertyTree: PropertyTree;
}

export interface EnonicAiAppliedRawData {
    topic: string;
    // can be anything, so will need to add a class to validate it and process if needed
    fields: PropertyArrayJson[];
}
