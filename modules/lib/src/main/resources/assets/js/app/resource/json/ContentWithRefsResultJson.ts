import {type ContentIdBaseItemJson} from './ContentIdBaseItemJson';
import {type InboundDependenciesJson} from './InboundDependenciesJson';

export interface ContentWithRefsResultJson {
    contentIds: ContentIdBaseItemJson[];
    inboundDependencies: InboundDependenciesJson[];
}
