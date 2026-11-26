import { type ContentIdBaseItemJson } from '../../../v6/entities/content/api/ContentIdBaseItemJson';

export interface InboundDependenciesJson {
    id: ContentIdBaseItemJson;
    inboundDependencies: ContentIdBaseItemJson[];
}
