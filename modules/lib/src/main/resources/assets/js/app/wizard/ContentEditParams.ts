import {type ContentId} from '../content/ContentId';
import {getActiveProjectName} from '../../v6/features/store/activeProject.store';

export class ContentEditParams {
    private readonly contentId: ContentId;

    private readonly projectName: string;

    private readonly localized: boolean = false;

    private readonly displayAsNew: boolean = false;

    constructor(builder: ContentEditParamsBuilder) {
        this.contentId = builder.contentId;
        this.projectName = builder.projectName || getActiveProjectName();
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

    getProjectName(): string {
        return this.projectName;
    }

    static create(contentId?: ContentId): ContentEditParamsBuilder {
        return new ContentEditParamsBuilder(contentId);
    }
}

export class ContentEditParamsBuilder {
    contentId: ContentId;

    projectName: string;

    localized: boolean = false;

    displayAsNew: boolean = false;

    constructor(contentId?: ContentId) {
        this.contentId = contentId;
    }

    setContentId(value: ContentId): this {
        this.contentId = value;
        return this;
    }

    setProjectName(value: string): this {
        this.projectName = value;
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
