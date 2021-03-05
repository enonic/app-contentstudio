export interface ContentIdBaseItemJson {
    id: string;
}

export interface ResolvePublishContentResultJson {
    dependentContents: ContentIdBaseItemJson[];
    requestedContents: ContentIdBaseItemJson[];
    requiredContents: ContentIdBaseItemJson[];
    containsInvalid: boolean;
    allPublishable: boolean;
    allPendingDelete: boolean;
    invalidContents: ContentIdBaseItemJson[];
    notReadyContents: ContentIdBaseItemJson[];
}
