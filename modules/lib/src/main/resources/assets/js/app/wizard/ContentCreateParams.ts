import {type ContentId} from '../content/ContentId';
import {type Project} from '../settings/data/project/Project';
import {ProjectContext} from '../project/ProjectContext';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export class ContentCreateParams {
    private readonly parentContentId?: ContentId;

    private readonly project: Project;

    private readonly contentTypeName: ContentTypeName;

    constructor(builder: ContentCreateParamsBuilder) {
        this.parentContentId = builder.parentContentId;
        this.project = builder.project || ProjectContext.get().getProject();
        this.contentTypeName = builder.contentTypeName;
    }

    getParentContentId(): ContentId {
        return this.parentContentId;
    }

    getProject(): Project {
        return this.project;
    }

    getContentTypeName(): ContentTypeName {
        return this.contentTypeName;
    }

    static create(): ContentCreateParamsBuilder {
        return new ContentCreateParamsBuilder();
    }
}

export class ContentCreateParamsBuilder {
    parentContentId: ContentId;

    project: Project;

    contentTypeName: ContentTypeName;

    setParentContentId(value: ContentId): this {
        this.parentContentId = value;
        return this;
    }

    setProject(value: Project): this {
        this.project = value;
        return this;
    }

    setContentTypeName(value: ContentTypeName): this {
        this.contentTypeName = value;
        return this;
    }

    build(): ContentCreateParams {
        return new ContentCreateParams(this);
    }
}
