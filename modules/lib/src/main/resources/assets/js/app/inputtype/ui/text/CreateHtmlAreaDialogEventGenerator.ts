import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {CreateHtmlAreaContentDialogEvent} from './CreateHtmlAreaContentDialogEvent';
import {CreateHtmlAreaDialogEvent, type HtmlAreaDialogConfig, HtmlAreaDialogType} from './CreateHtmlAreaDialogEvent';
import {CreateHtmlAreaMacroDialogEvent} from './CreateHtmlAreaMacroDialogEvent';
import {type FullScreenDialogParams, type MacroDialogParams} from './HtmlEditorTypes';
import {type HtmlEditorParams} from './HtmlEditorParams';

type eventInfo = CKEDITOR.eventInfo;

export class CreateHtmlAreaDialogEventGenerator {

    private readonly editorParams: HtmlEditorParams;

    constructor(editorParams: HtmlEditorParams) {
        this.editorParams = editorParams;
    }

    generateFromEventInfoAndFire(dialogShowEvent: eventInfo): void {
        this.doGenerateAndFire(this.generateEventFrom(dialogShowEvent), dialogShowEvent);
    }

    private generateEventFrom(dialogShowEvent: eventInfo): CreateHtmlAreaDialogEvent {
        const eventName: string = dialogShowEvent.data.getName();
        const eventType: HtmlAreaDialogType = this.getEventType(eventName);

        // using ObjectHelper since enum type has zero as index for the first item and converts to false
        if (ObjectHelper.isDefined(eventType)) {
            return this.doGenerateEventFrom(dialogShowEvent, eventType);
        }

        return null;
    }

    private getEventType(name: string): HtmlAreaDialogType {
        if (name === 'anchor') {
            return HtmlAreaDialogType.ANCHOR;
        }

        if (name === 'sourcedialog') {
            return HtmlAreaDialogType.CODE;
        }

        if (name === 'specialchar') {
            return HtmlAreaDialogType.SPECIALCHAR;
        }

        if (name === 'link') {
            return HtmlAreaDialogType.LINK;
        }

        if (name === 'image2') {
            return HtmlAreaDialogType.IMAGE;
        }

        if (name === 'numberedListStyle') {
            return HtmlAreaDialogType.NUMBERED_LIST;
        }

        if (name === 'bulletedListStyle') {
            return HtmlAreaDialogType.BULLETED_LIST;
        }

        if (name === 'table' || name === 'tableProperties') {
            return HtmlAreaDialogType.TABLE;
        }

        return null;
    }

    private doGenerateEventFrom(config: HtmlAreaDialogConfig, type: HtmlAreaDialogType): CreateHtmlAreaDialogEvent {
        if (type === HtmlAreaDialogType.LINK || type === HtmlAreaDialogType.IMAGE) {
            return this.createContentDialogEvent(config, type);
        }

        return this.createDialogEvent(config, type);
    }

    private createDialogEvent(config: HtmlAreaDialogConfig, type: HtmlAreaDialogType): CreateHtmlAreaDialogEvent {
        return CreateHtmlAreaDialogEvent.create()
            .setConfig(config)
            .setType(type)
            .setProject(this.editorParams.getProject())
            .build();
    }

    private createContentDialogEvent(config: HtmlAreaDialogConfig, type: HtmlAreaDialogType): CreateHtmlAreaContentDialogEvent {
        return CreateHtmlAreaContentDialogEvent.create()
            .setConfig(config)
            .setProject(this.editorParams.getProject())
            .setType(type)
            .setContent(this.editorParams.getContent())
            .build();
    }

    private processOriginalEvent(dialogShowEvent: eventInfo, type: HtmlAreaDialogType): void {
        if (type === HtmlAreaDialogType.SPECIALCHAR) {
            dialogShowEvent.data.hide();
        }
    }

    private doGenerateAndFire(event: CreateHtmlAreaDialogEvent, dialogShowEvent?: eventInfo): void {
        if (event) {
            if (dialogShowEvent) {
                this.processOriginalEvent(dialogShowEvent, event.getType());
            }
            this.publishCreateDialogEvent(event);
        } else {
            this.handleEventNotFound();
        }
    }

    private publishCreateDialogEvent(event: CreateHtmlAreaDialogEvent) {
        if (this.editorParams.hasCreateDialogListener()) {
            this.editorParams.getCreateDialogListener()(event);
        }

        event.fire();
    }

    private handleEventNotFound(): void {
        //
    }

    generateMacroEventAndFire(config: MacroDialogParams): void {
        this.doGenerateAndFire(this.createMacroDialogEvent(config));
    }

    private createMacroDialogEvent(config: MacroDialogParams): CreateHtmlAreaMacroDialogEvent {
        return CreateHtmlAreaMacroDialogEvent.create()
            .setConfig(config)
            .setType(HtmlAreaDialogType.MACRO)
            .setContent(this.editorParams.getContent())
            .setApplicationKeys(this.editorParams.getApplicationKeys())
            .build();
    }

    generateFullScreenEventAndFire(config: FullScreenDialogParams): void {
        this.doGenerateAndFire(this.createDialogEvent(config, HtmlAreaDialogType.FULLSCREEN));
    }
}
