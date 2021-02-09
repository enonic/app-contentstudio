import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {HtmlArea} from './HtmlArea';

export class HtmlAreaResizeEvent
    extends Event {
    private htmlArea: HtmlArea;

    constructor(htmlArea: HtmlArea) {
        super();
        this.htmlArea = htmlArea;
    }

    getHtmlArea(): HtmlArea {
        return this.htmlArea;
    }

    static on(handler: (event: HtmlAreaResizeEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: HtmlAreaResizeEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
