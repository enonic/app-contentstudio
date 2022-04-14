import {WizardHeaderWithDisplayNameAndName} from 'lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {i18n} from 'lib-admin-ui/util/Messages';
import {PropertyChangedEvent} from 'lib-admin-ui/PropertyChangedEvent';
import {ContentExistsByPathRequest} from '../resource/ContentExistsByPathRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {RenameContentDialog} from './RenameContentDialog';
import {Content} from '../content/Content';
import {ButtonEl} from 'lib-admin-ui/dom/ButtonEl';
import {ContentPath} from '../content/ContentPath';
import * as Q from 'q';
import {DivEl} from 'lib-admin-ui/dom/DivEl';

export class ContentWizardHeader
    extends WizardHeaderWithDisplayNameAndName {

    private isNameUnique: boolean = true;

    private persistedContent: Content;

    private renameDialog: RenameContentDialog;

    private asyncNameChecksRunning: number = 0;

    private debouncedNameUniqueChecker: () => void;

    private lockElem: ButtonEl;

    private loadSpinner: DivEl;

    private nameCheckIsOnListeners: { (): void } [] = [];

    private nameCheckIsOffListeners: { (): void } [] = [];

    private renamedListeners: { (): void } [] = [];

    constructor() {
        super();
    }

    protected initElements() {
        super.initElements();

        this.lockElem = new ButtonEl();
        this.loadSpinner = new DivEl('icon-spinner');
        this.loadSpinner.hide();
    }

    protected initListeners() {
        super.initListeners();

        this.onPropertyChanged((event: PropertyChangedEvent) => {
            if (event.getPropertyName() === `<${i18n('field.path')}>`) {
                if (this.getName() === '') {
                    this.updateIsNameUnique(true);
                } else {
                    this.lock();
                    this.debouncedNameUniqueChecker();
                }
            }
        });

        this.lockElem.onClicked(() => {
            if (!this.renameDialog) {
                this.renameDialog = new RenameContentDialog();

                this.renameDialog.onRenamed((newName: string) => {
                    this.setOnline(false);
                    this.setName(newName, true);
                    this.notifyRenamed();
                });
            }

            this.renameDialog.setInitialPath(this.persistedContent.getPath()).open();
        });

        this.debouncedNameUniqueChecker = AppHelper.debounce(() => {
            if (this.isNameChanged()) {
                this.asyncNameChecksRunning++;

                new ContentExistsByPathRequest(this.getNewPath().toString()).sendAndParse().then((exists: boolean) => {
                    if (this.asyncNameChecksRunning === 1 && exists === this.isNameUnique) {
                        this.updateIsNameUnique(!exists || !this.isNameChanged());
                    }

                    return Q();
                }).catch(DefaultErrorHandler.handle).finally(() => {
                    this.asyncNameChecksRunning--;
                    this.unlock();
                });
            } else {
                if (!this.isNameUnique) {
                    this.updateIsNameUnique(true);
                }

                this.unlock();
            }
        }, 900);
    }

    setName(value: string, silent?: boolean) {
        this.nameEl.setValue(value, silent);
    }

    refreshNameUniqueness() {
        if (this.isNameChanged()) {
            this.lock();
            this.debouncedNameUniqueChecker();
        }
    }

    private updateIsNameUnique(isUnique: boolean) {
        this.isNameUnique = isUnique;
        this.toggleClass('path-exists', !isUnique);
        this.notifyPropertyChanged('unique', '' + !isUnique, '' + isUnique);
    }

    private isNameChanged(): boolean {
        const name: string = this.getName();

        return name !== '' && name !== this.persistedContent.getPath().getName();
    }

    private getNewPath(): ContentPath {
        return ContentPath.create().fromParent(this.persistedContent.getPath().getParentPath(), this.getName()).build();
    }

    setPersistedPath(value: Content) {
        this.persistedContent = value;
        this.updateIsNameUnique(true);
    }

    setOnline(value: boolean) {
        this.toggleClass('locked', value);
        this.toggleNameInput(!value);
    }

    isValid(): boolean {
        return super.isValid() && this.isNameUnique;
    }

    isValidForSaving(): boolean {
        return !!this.getName() && this.isNameUnique;
    }

    toggleNameInput(enable: boolean): void {
        if (enable && this.hasClass('locked')) {
            return;
        }

        super.toggleNameInput(enable);
    }

    private lock(): void {
        this.loadSpinner.show();
        this.notifyNameCheckIsOn();
    }

    private unlock(): void {
        this.loadSpinner.hide();
        this.notifyNameCheckIsOff();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const nameErrorBlock: SpanEl = new SpanEl('path-error');
            nameErrorBlock.setHtml(i18n('path.not.available'));
            this.bottomRow.appendChild(nameErrorBlock);

            this.lockElem.addClass('lock-name icon-pencil');
            this.lockElem.setTitle(i18n('path.lock'));
            this.bottomRow.appendChildren(this.lockElem, this.loadSpinner);

            return rendered;
        });
    }

    onNameCheckIsOn(listener: () => void) {
        this.nameCheckIsOnListeners.push(listener);
    }

    unNameCheckIsOn(listener: () => void) {
        this.nameCheckIsOnListeners = this.nameCheckIsOnListeners.filter((curr:  { (): void }) => {
            return curr !== listener;
        });
        return this;
    }

    private notifyNameCheckIsOn() {
        this.nameCheckIsOnListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    onNameCheckIsOff(listener: () => void) {
        this.nameCheckIsOffListeners.push(listener);
    }

    unNameCheckIsOff(listener: () => void) {
        this.nameCheckIsOffListeners = this.nameCheckIsOffListeners.filter((curr:  { (): void }) => {
            return curr !== listener;
        });
        return this;
    }

    private notifyNameCheckIsOff() {
        this.nameCheckIsOffListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    onRenamed(listener: () => void) {
        this.renamedListeners.push(listener);
    }

    unRenamed(listener: () => void) {
        this.renamedListeners = this.renamedListeners.filter((curr:  { (): void }) => {
            return curr !== listener;
        });
        return this;
    }

    private notifyRenamed() {
        this.renamedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }
}
