import {type ContentId} from '../content/ContentId';
import {type Project} from '../settings/data/project/Project';
import {ProjectContext} from '../project/ProjectContext';

export class ContentEditParams {
    private readonly contentId: ContentId;

    private readonly project: Project;

    private readonly localized: boolean = false;

    private readonly displayAsNew: boolean = false;

    constructor(builder: ContentEditParamsBuilder) {
        this.contentId = builder.contentId;
        this.project = builder.project || ProjectContext.get().getProject();
        this.localized = builder.localized;
        this.displayAsNew = builder.displayAsNew;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getLocalized(): boolean {
        return this.localized;
    }

    getDisplayAsNew(): boolean {
        return this.displayAsNew;
    }

    getProject(): Project {
        return this.project;
    }

    static create(contentId?: ContentId): ContentEditParamsBuilder {
        return new ContentEditParamsBuilder(contentId);
    }
}

export class ContentEditParamsBuilder {
    contentId: ContentId;

    project: Project;

    localized: boolean = false;

    displayAsNew: boolean = false;

    constructor(contentId?: ContentId) {
        this.contentId = contentId;
    }

    setContentId(value: ContentId): this {
        this.contentId = value;
        return this;
    }

    setProject(value: Project): this {
        this.project = value;
        return this;
    }

    setLocalized(value: boolean): this {
        this.localized = value;
        return this;
    }

    setDisplayAsNew(value: boolean): this {
        this.displayAsNew = value;
        return this;
    }

    build(): ContentEditParams {
        return new ContentEditParams(this);
    }
}
