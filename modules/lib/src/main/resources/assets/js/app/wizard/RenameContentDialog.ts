import {ModalDialog} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {i18n} from 'lib-admin-ui/util/Messages';
import {InputEl} from 'lib-admin-ui/dom/InputEl';
import * as Q from 'q';
import {Action} from 'lib-admin-ui/ui/Action';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ContentExistsByPathRequest} from '../resource/ContentExistsByPathRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentPath} from '../content/ContentPath';

export class RenameContentDialog extends ModalDialog {

    private nameInput: InputEl;

    private renameAction: Action;

    private initialPath: ContentPath;

    private contentPathSubHeader: H6El;

    private statusBlock: DivEl;

    constructor() {
        super({
            title: i18n('dialog.rename.title'),
            class: 'rename-content-dialog'
        });
    }

    protected initElements(): void {
        super.initElements();

        this.nameInput = new InputEl('name');
        this.renameAction = new Action(i18n('action.rename'), '');
        this.renameAction.setEnabled(false);
        this.contentPathSubHeader = new H6El().addClass('content-path');
        this.statusBlock = new DivEl('status-block');
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

        const debouncedNameUniqueChecker: () => void = AppHelper.debounce(() => {
            if (StringHelper.isBlank(this.getNameInputValue()) || this.getNameInputValue() === this.initialPath.getName()) {
                this.disableRename();
            } else {
                new ContentExistsByPathRequest(this.getNewPath().toString()).sendAndParse().then((exists: boolean) => {
                    this.setNameAvailable(!exists);
                }).catch(DefaultErrorHandler.handle);
            }
        }, 500);

        this.nameInput.onValueChanged(() => {
            debouncedNameUniqueChecker();
        });

        this.renameAction.onExecuted(() => {
           this.close();
        });
    }

    private setNameAvailable(value: boolean) {
        this.renameAction.setEnabled(value);
        this.statusBlock.toggleClass('available', value);
        this.statusBlock.setHtml(value ? i18n('path.available') : i18n('path.not.available'));
    }

    private disableRename() {
        this.renameAction.setEnabled(false);
        this.statusBlock.setHtml('');
        this.statusBlock.removeClass('available');
    }

    setInitialPath(value: ContentPath): RenameContentDialog {
        this.initialPath = value;
        return this;
    }

    private getNewPath(): ContentPath {
        return ContentPath.fromParent(this.initialPath.getParentPath(), this.getNameInputValue());
    }

    onRenamed(handler: (newName: string) => void) {
        this.renameAction.onExecuted(() => {
            handler(this.getNameInputValue());
        });
    }

    show(): void {
        this.disableRename();
        this.nameInput.resetBaseValues();
        this.nameInput.setValue(this.initialPath.getName(), true);
        this.contentPathSubHeader.setHtml(this.initialPath.toString());
        this.statusBlock.removeClass('available');
        super.show();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(this.contentPathSubHeader);
            const label: H6El = new H6El('input-label');
            label.setHtml(i18n('dialog.rename.label'));
            this.appendChildToContentPanel(label);
            const inputWrapper: DivEl = new DivEl('input-wrapper');
            inputWrapper.appendChildren(this.nameInput, this.statusBlock);
            this.appendChildToContentPanel(inputWrapper);
            this.addAction(this.renameAction);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }
}
