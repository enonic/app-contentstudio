import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import type Q from 'q';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {type ContentPath} from '../../content/ContentPath';
import {RenameInput} from './RenameInput';
import {ValidityStatus, type ValueValidationState} from '../../inputtype/text/CheckedValueInput';

export class RenameContentDialog extends ModalDialog {

    private nameInput: RenameInput;

    private renameAction: Action;

    private contentPathSubHeader: H6El;

    constructor() {
        super({
            title: i18n('dialog.rename.title'),
            class: 'rename-content-dialog'
        });
    }

    protected initElements(): void {
        super.initElements();

        this.nameInput = new RenameInput();
        this.renameAction = new Action(i18n('action.rename'), '');
        this.renameAction.setEnabled(false);
        this.contentPathSubHeader = new H6El().addClass('content-path');
    }

    protected postInitElements() {
        super.postInitElements();

        this.setElementToFocusOnShow(this.nameInput);
    }

    private getNameInputValue(): string {
        return this.nameInput.getValue().trim();
    }

    protected initListeners(): void {
        super.initListeners();

        this.renameAction.onExecuted(() => {
           this.close();
        });

        this.nameInput.onValueCheckInProgress(() => {
           this.disableRename();
        });

        this.nameInput.onStateUpdated((state: ValueValidationState) => {
            this.renameAction.setEnabled(state.getStatus() === ValidityStatus.VALID);
        });
    }

    private disableRename() {
        this.renameAction.setEnabled(false);
    }

    setInitialPath(value: ContentPath): RenameContentDialog {
        this.nameInput.reset();
        this.nameInput.setInitialPath(value);
        this.contentPathSubHeader.setHtml(value.toString());
        return this;
    }

    onRenamed(handler: (newName: string) => void) {
        this.renameAction.onExecuted(() => {
            handler(this.getNameInputValue());
        });
    }

    show(): void {
        this.disableRename();
        super.show();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(this.contentPathSubHeader);
            this.appendChildToContentPanel(this.nameInput);
            this.addAction(this.renameAction);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }
}
