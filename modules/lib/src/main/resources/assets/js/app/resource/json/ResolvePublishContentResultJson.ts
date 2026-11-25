import { type ContentIdBaseItemJson } from '../../../v6/entities/content/api/ContentIdBaseItemJson';

export interface ResolvePublishContentResultJson {
    dependentContents: ContentIdBaseItemJson[];
    requestedContents: ContentIdBaseItemJson[];
    requiredContents: ContentIdBaseItemJson[];
    publishableContents: ContentIdBaseItemJson[];
    containsInvalid: boolean;
    notPublishableContents: ContentIdBaseItemJson[];
    somePublishable: boolean;
    schedulable: boolean;
    invalidContents: ContentIdBaseItemJson[];
    notReadyContents: ContentIdBaseItemJson[];
    nextDependentContents: ContentIdBaseItemJson[];
    notFoundOutboundContents: ContentIdBaseItemJson[];
}
