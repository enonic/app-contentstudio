import {ContentIdBaseItemJson} from './ContentIdBaseItemJson';

export interface ResolvePublishContentResultJson {
    dependentContents: ContentIdBaseItemJson[];
    requestedContents: ContentIdBaseItemJson[];
    requiredContents: ContentIdBaseItemJson[];
    containsInvalid: boolean;
    notPublishableContents: ContentIdBaseItemJson[];
    allPendingDelete: boolean;
    invalidContents: ContentIdBaseItemJson[];
    notReadyContents: ContentIdBaseItemJson[];
    nextDependentContents: ContentIdBaseItemJson[];
}
