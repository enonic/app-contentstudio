import ContentPath = api.content.ContentPath;
import ContentSummary = api.content.ContentSummary;
import ApplicationKey = api.application.ApplicationKey;

export enum HtmlAreaDialogType {
    ANCHOR, IMAGE, LINK, MACRO, SEARCHREPLACE, CODE, SPECIALCHAR, FULLSCREEN
}

export class CreateHtmlAreaDialogEvent
    extends api.event.Event {

    private config: any;

    private type: HtmlAreaDialogType;

    private content: ContentSummary;

    private contentPath: ContentPath;

    private applicationKeys: ApplicationKey[];

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
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: CreateHtmlAreaDialogEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
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
