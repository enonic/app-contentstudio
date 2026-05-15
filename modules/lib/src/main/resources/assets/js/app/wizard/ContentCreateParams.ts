import {type ContentId} from '../content/ContentId';
import {getActiveProjectName} from '../../v6/features/store/activeProject.store';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export class ContentCreateParams {
    private readonly parentContentId?: ContentId;

    private readonly projectName: string;

    private readonly contentTypeName: ContentTypeName;

    constructor(builder: ContentCreateParamsBuilder) {
        this.parentContentId = builder.parentContentId;
        this.projectName = builder.projectName || getActiveProjectName();
        this.contentTypeName = builder.contentTypeName;
    }

    getParentContentId(): ContentId {
        return this.parentContentId;
    }

    getProjectName(): string {
        return this.projectName;
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

    projectName: string;

    contentTypeName: ContentTypeName;

    setParentContentId(value: ContentId): this {
        this.parentContentId = value;
        return this;
    }

    setProjectName(value: string): this {
        this.projectName = value;
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
