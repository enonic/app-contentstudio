import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ContentSummary} from '../../../content/ContentSummary';
import {ContentPath} from '../../../content/ContentPath';

export enum HtmlAreaDialogType {
    ANCHOR, IMAGE, LINK, MACRO, SEARCHREPLACE, CODE, SPECIALCHAR, FULLSCREEN, TABLE, NUMBERED_LIST, BULLETED_LIST
}

export class CreateHtmlAreaDialogEvent
    extends Event {

    private readonly config: any;

    private readonly type: HtmlAreaDialogType;

    private readonly content: ContentSummary;

    private readonly contentPath: ContentPath;

    private readonly applicationKeys: ApplicationKey[];

    constructor(builder: CreateHtmlAreaDialogEventBuilder) {
        super();

        this.config = builder.config;
        this.type = builder.type;
        this.content = builder.content;
        this.contentPath = builder.contentPath;
        this.applicationKeys = builder.applicationKeys;
    }

    getConfig(): any {
        return this.config;
    }

    getType(): HtmlAreaDialogType {
        return this.type;
    }

    getContent(): ContentSummary {
        return this.content;
    }

    getContentPath(): ContentPath {
        return this.contentPath;
    }

    getApplicationKeys(): ApplicationKey[] {
        return this.applicationKeys;
    }

    static create(): CreateHtmlAreaDialogEventBuilder {
        return new CreateHtmlAreaDialogEventBuilder();
    }

    static on(handler: (event: CreateHtmlAreaDialogEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: CreateHtmlAreaDialogEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}

export class CreateHtmlAreaDialogEventBuilder {

    config: any;

    type: HtmlAreaDialogType;

    content: ContentSummary;

    contentPath: ContentPath;

    applicationKeys: ApplicationKey[];

    setContent(content: ContentSummary): CreateHtmlAreaDialogEventBuilder {
        this.content = content;
        return this;
    }

    setContentPath(contentPath: ContentPath): CreateHtmlAreaDialogEventBuilder {
        this.contentPath = contentPath;
        return this;
    }

    setType(type: HtmlAreaDialogType): CreateHtmlAreaDialogEventBuilder {
        this.type = type;
        return this;
    }

    setConfig(config: any): CreateHtmlAreaDialogEventBuilder {
        this.config = config;
        return this;
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]): CreateHtmlAreaDialogEventBuilder {
        this.applicationKeys = applicationKeys;
        return this;
    }

    build(): CreateHtmlAreaDialogEvent {

        return new CreateHtmlAreaDialogEvent(this);
    }
}
