import { type ContentIdBaseItemJson } from '../../../v6/entities/content/api/ContentIdBaseItemJson';
import { type InboundDependenciesJson } from './InboundDependenciesJson';

export interface ContentWithRefsResultJson {
    contentIds: ContentIdBaseItemJson[];
    inboundDependencies: InboundDependenciesJson[];
}
