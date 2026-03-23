import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {type Project} from '../../../settings/data/project/Project';
import {
    type AnchorDialogParams,
    type CodeDialogParams,
    type FullScreenDialogParams,
    type MacroDialogParams,
    type SpecialCharDialogParams,
    type TableQuicktablePopupParams,
} from './HtmlEditorTypes';

type eventInfo = CKEDITOR.eventInfo;

export enum HtmlAreaDialogType {
    ANCHOR, IMAGE, LINK, MACRO, CODE, SPECIALCHAR, FULLSCREEN, TABLE_QUICKTABLE, TABLE, NUMBERED_LIST, BULLETED_LIST
}

export type HtmlAreaDialogConfig =
    eventInfo |
    AnchorDialogParams |
    CodeDialogParams |
    MacroDialogParams |
    FullScreenDialogParams |
    SpecialCharDialogParams |
    TableQuicktablePopupParams;

export class CreateHtmlAreaDialogEvent
    extends Event {

    private readonly config: HtmlAreaDialogConfig;

    private readonly type: HtmlAreaDialogType;

    private readonly project?: Readonly<Project>;

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
        return this.project as Project;
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

    config: HtmlAreaDialogConfig;

    type: HtmlAreaDialogType;

    project: Readonly<Project>;

    setType(type: HtmlAreaDialogType): this {
        this.type = type;
        return this;
    }

    setConfig(config: HtmlAreaDialogConfig): this {
        this.config = config;
        return this;
    }

    setProject(project: Readonly<Project>): this {
        this.project = project;
        return this;
    }

    build(): CreateHtmlAreaDialogEvent {
        return new CreateHtmlAreaDialogEvent(this);
    }
}
