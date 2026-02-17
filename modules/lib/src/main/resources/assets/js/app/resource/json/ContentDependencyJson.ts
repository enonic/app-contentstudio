import {type ContentDependencyGroupJson} from './ContentDependencyGroupJson';

export interface ContentDependencyJson {

    inbound: ContentDependencyGroupJson[];

    outbound: ContentDependencyGroupJson[];

}
