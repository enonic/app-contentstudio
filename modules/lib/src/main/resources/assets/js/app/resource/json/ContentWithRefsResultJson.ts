import {ContentIdBaseItemJson} from './ContentIdBaseItemJson';
import {InboundDependenciesJson} from './InboundDependenciesJson';

export interface ContentWithRefsResultJson {
    contentIds: ContentIdBaseItemJson[];
    inboundDependencies: InboundDependenciesJson[];
}
