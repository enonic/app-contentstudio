import {ContentIdBaseItemJson} from './ContentIdBaseItemJson';

export interface ResolveContentForDeleteJson {
    contentIds: ContentIdBaseItemJson[];
    inboundDependencies: ContentIdBaseItemJson[];
}
