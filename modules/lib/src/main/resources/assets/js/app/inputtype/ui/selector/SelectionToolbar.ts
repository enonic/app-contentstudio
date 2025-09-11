import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import * as $ from 'jquery';

export class SelectionToolbar
    extends DivEl {

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
