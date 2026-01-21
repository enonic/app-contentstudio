import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {Project} from '../../../settings/data/project/Project';
import {FullScreenDialogParams, MacroDialogParams} from './HtmlEditor';
import eventInfo = CKEDITOR.eventInfo;

export enum HtmlAreaDialogType {
    ANCHOR, IMAGE, LINK, MACRO, CODE, SPECIALCHAR, FULLSCREEN, TABLE, NUMBERED_LIST, BULLETED_LIST
}

export type HtmlAreaDialogConfig = eventInfo | MacroDialogParams | FullScreenDialogParams;

export class CreateHtmlAreaDialogEvent
    extends IframeEvent {

    private readonly config: HtmlAreaDialogConfig;

    private readonly type: HtmlAreaDialogType;

    private readonly project?: Project;

    constructor(builder: CreateHtmlAreaDialogEventBuilder) {
        super();

        this.config = builder.config;
        this.type = builder.type;
        this.project = builder.project;
    }

    getConfig(): HtmlAreaDialogConfig {
        return this.config;
    }

    getType(): HtmlAreaDialogType {
        return this.type;
    }

    getProject(): Project {
        return this.project;
    }

    static create(): CreateHtmlAreaDialogEventBuilder {
        return new CreateHtmlAreaDialogEventBuilder();
    }

    static on(handler: (event: CreateHtmlAreaDialogEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: CreateHtmlAreaDialogEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}

export class CreateHtmlAreaDialogEventBuilder {

    config: HtmlAreaDialogConfig;

    type: HtmlAreaDialogType;

    project: Project;

    setType(type: HtmlAreaDialogType): this {
        this.type = type;
        return this;
    }

    setConfig(config: HtmlAreaDialogConfig): this {
        this.config = config;
        return this;
    }

    setProject(project: Project): this {
        this.project = project;
        return this;
    }

    build(): CreateHtmlAreaDialogEvent {
        return new CreateHtmlAreaDialogEvent(this);
    }
}
