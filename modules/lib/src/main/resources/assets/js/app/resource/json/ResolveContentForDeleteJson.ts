import {ContentIdBaseItemJson} from './ContentIdBaseItemJson';
import {InboundDependenciesJson} from './InboundDependenciesJson';

export interface ResolveContentForDeleteJson {
    contentIds: ContentIdBaseItemJson[];
    inboundDependencies: InboundDependenciesJson[];
}
