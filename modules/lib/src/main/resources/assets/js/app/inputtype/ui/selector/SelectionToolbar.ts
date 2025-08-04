import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import * as $ from 'jquery';

export class SelectionToolbar
    extends DivEl {

    static stickyCls: string = 'sticky-toolbar';

    private editButton: Button;

    private removeButton: Button;

    private removableCount: number;

    private editableCount: number;

    private editClickListeners: (() => void)[] = [];

    private removeClickListeners: (() => void)[] = [];

    constructor(config?: {editable: boolean}) {
        super('selection-toolbar');

        this.initElements(!config || config.editable);
        this.initListeners();
    }

    private initElements(editable: boolean): void {
        if (editable) {
            this.editButton = new Button(i18n('button.edit'));
            this.editButton.addClass('large edit blue');
            this.appendChild(this.editButton);
        }

        this.removeButton = new Button(i18n('button.remove'));
        this.removeButton.addClass('large');
        this.appendChild(this.removeButton);
    }

    private initListeners(): void {
        this.editButton?.onClicked(() => this.notifyEditClicked());
        this.removeButton.onClicked(() => this.notifyRemoveClicked());

        this.onShown(() => this.update());
        this.onHidden(() => this.removeClass(SelectionToolbar.stickyCls));
    }

    update(afterResize: boolean = false) {
        if (!this.isVisible()) {
            return;
        }

        const selectedOptionsViewRect = this.getHTMLElement().getBoundingClientRect();
        const windowHeight = (window.innerHeight || document.documentElement.clientHeight);

        if (this.hasClass(SelectionToolbar.stickyCls)) {
            const toolbarHeight = this.getEl().getHeightWithBorder();

            if (selectedOptionsViewRect.bottom + toolbarHeight <= windowHeight ||
                selectedOptionsViewRect.top + 10 >= windowHeight) {
                this.removeClass(SelectionToolbar.stickyCls);
                this.getEl().setWidth('100%');
            } else if (afterResize) {
                this.getEl().setWidthPx(this.getEl().getWidth());
            }
        } else {

            const toolbarRect = this.getHTMLElement().getBoundingClientRect();

            if (toolbarRect.bottom > windowHeight &&
                selectedOptionsViewRect.top + 10 < windowHeight) {
                this.unstickOtherToolbars();
                this.addClass(SelectionToolbar.stickyCls);
                this.getEl().setWidthPx(this.getEl().getWidth());
            }
        }
    }

    private unstickOtherToolbars() {
        $('.' + SelectionToolbar.stickyCls).removeClass(SelectionToolbar.stickyCls);
    }

    setSelectionCount(removableCount: number, editableCount: number) {
        this.editableCount = editableCount;
        this.removableCount = removableCount;
        this.refreshUI();
    }

    private refreshUI() {
        this.editButton?.setLabel(i18n('button.edit') + ' ' + (this.editableCount > 1 ? ' (' + this.editableCount + ')' : ''));
        this.editButton?.setEnabled(this.editableCount > 0);
        this.removeButton.setLabel(i18n('button.remove') + ' ' + (this.removableCount > 1 ? ' (' + this.removableCount + ')' : ''));
    }

    notifyEditClicked() {
        this.editClickListeners.forEach((listener) => {
            listener();
        });
    }

    onEditClicked(listener: () => void) {
        this.editClickListeners.push(listener);
    }

    unEditClicked(listener: () => void) {
        this.editClickListeners = this.editClickListeners
            .filter(function (curr: () => void) {
                return curr !== listener;
            });
    }

    notifyRemoveClicked() {
        this.removeClickListeners.forEach((listener) => {
            listener();
        });
    }

    onRemoveClicked(listener: () => void) {
        this.removeClickListeners.push(listener);
    }

    unRemoveClicked(listener: () => void) {
        this.removeClickListeners = this.removeClickListeners
            .filter(function (curr: () => void) {
                return curr !== listener;
            });
    }

}
