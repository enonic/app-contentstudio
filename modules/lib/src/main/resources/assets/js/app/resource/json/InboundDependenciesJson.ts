import {type ContentIdBaseItemJson} from './ContentIdBaseItemJson';

export interface InboundDependenciesJson {
    id: ContentIdBaseItemJson;
    inboundDependencies: ContentIdBaseItemJson[];
}
