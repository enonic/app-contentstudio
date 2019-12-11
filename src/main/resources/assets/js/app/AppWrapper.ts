import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';

export class AppWrapper
    extends DivEl {

    private sidebar: DivEl;

    private mainPanel: DivEl;

    private toggleIcon: Button;

    constructor() {
        super('main-app-wrapper');

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.sidebar = new DivEl('sidebar');
        this.mainPanel = new DivEl('main');
        this.toggleIcon = new ToggleIcon();
    }

    private initListeners() {
        this.toggleIcon.onClicked(this.toggleState.bind(this));
    }

    private toggleState() {
        const isSidebarVisible: boolean = this.hasClass('sidebar-expanded');
        this.toggleClass('sidebar-expanded', !isSidebarVisible);
        this.toggleIcon.toggleClass('toggled', !isSidebarVisible);
    }

    appendToMain(element: Element) {
        this.mainPanel.appendChild(element);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.toggleIcon.addClass('launcher-button');
            this.appendChildren(this.toggleIcon, this.sidebar, this.mainPanel);

            return rendered;
        });
    }

}

class ToggleIcon
    extends Button {

    constructor() {
        super();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            const lines: SpanEl = new SpanEl('lines');
            this.appendChild(lines);

            return rendered;
        });
    }
}
