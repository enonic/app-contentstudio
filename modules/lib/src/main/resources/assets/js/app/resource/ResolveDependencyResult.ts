import {type ContentDependencyJson} from './json/ContentDependencyJson';
import {type ContentId} from '../content/ContentId';

export interface ResolveDependencyResultJson {

    contentId: string;

    dependency: ContentDependencyJson;

}

export class ResolveDependencyResult {

    private readonly contentId: ContentId;

    private readonly dependency: ContentDependencyJson;

    constructor(contentId: ContentId, dependency: ContentDependencyJson) {

        this.contentId = contentId;
        this.dependency = dependency;
    }

    getDependency(): ContentDependencyJson {
        return this.dependency;
    }

    getContentId(): ContentId {
        return this.contentId;
    }
}
