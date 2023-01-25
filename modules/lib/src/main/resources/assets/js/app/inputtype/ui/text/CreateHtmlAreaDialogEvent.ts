import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Project} from '../../../settings/data/project/Project';

export enum HtmlAreaDialogType {
    ANCHOR, IMAGE, LINK, MACRO, SEARCHREPLACE, CODE, SPECIALCHAR, FULLSCREEN, TABLE, NUMBERED_LIST, BULLETED_LIST
}

export class CreateHtmlAreaDialogEvent
    extends Event {

    private readonly config: any;

    private readonly type: HtmlAreaDialogType;

    private readonly project?: Project;

    constructor(builder: CreateHtmlAreaDialogEventBuilder) {
        super();

        this.config = builder.config;
        this.type = builder.type;
        this.project = builder.project;
    }

    getConfig(): any {
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
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: CreateHtmlAreaDialogEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}

export class CreateHtmlAreaDialogEventBuilder {

    config: any;

    type: HtmlAreaDialogType;

    project: Project;

    setType(type: HtmlAreaDialogType): this {
        this.type = type;
        return this;
    }

    setConfig(config: any): this {
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
