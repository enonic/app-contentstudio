import {ContentId} from '../../content/ContentId';

export interface ContentDependency {
    isInbound: boolean,
    dependencyId: ContentId
}
