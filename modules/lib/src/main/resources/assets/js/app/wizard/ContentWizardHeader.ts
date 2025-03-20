import {WizardHeaderWithDisplayNameAndName} from '@enonic/lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PropertyChangedEvent} from '@enonic/lib-admin-ui/PropertyChangedEvent';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {Content} from '../content/Content';
import {ContentPath} from '../content/ContentPath';
import {ContentExistsByPathRequest} from '../resource/ContentExistsByPathRequest';
import {RenameContentDialog} from './dialog/RenameContentDialog';
import {AiStateTool} from '@enonic/lib-admin-ui/ai/tool/AiStateTool';
import {AiContentDataHelper} from '../ai/AiContentDataHelper';
import {AiAnimationTool} from '@enonic/lib-admin-ui/ai/tool/AiAnimationTool';
import {AI} from '../ai/AI';
import {AiDialogIconTool} from '@enonic/lib-admin-ui/ai/tool/AiDialogIconTool';

export class ContentWizardHeader
    extends WizardHeaderWithDisplayNameAndName {

    private static LOCKED_CLASS: string = 'locked';

    private isNameUnique: boolean = true;

    private persistedContent: Content;

    private renameDialog: RenameContentDialog;

    private asyncNameChecksRunning: number = 0;

    private debouncedNameUniqueChecker: () => void;

    private loadSpinner: DivEl;

    private nameCheckIsOnListeners: (() => void) [] = [];

    private nameCheckIsOffListeners: (() => void) [] = [];

    private renamedListeners: (() => void) [] = [];

    constructor() {
        super();
    }

    protected initElements() {
        super.initElements();

        this.loadSpinner = new DivEl('icon-spinner');
        this.loadSpinner.hide();

        this.onRendered(() => {
            if (AI.get().has('contentOperator')) {
                const getDataPath = () => this.getAiDataPath();

                new AiStateTool({
                    group: AiContentDataHelper.DATA_PREFIX,
                    pathElement: this.displayNameEl,
                    getPath: getDataPath,
                    label: i18n('field.displayName'),
                    stateContainer: this.displayNameEl.getParentElement(),
                });

                new AiDialogIconTool({
                    group: AiContentDataHelper.DATA_PREFIX,
                    getPath: getDataPath,
                    pathElement: this.displayNameEl,
                    aiButtonContainer: this.topRow,
                    setContextOnFocus: true,
                });

                new AiAnimationTool({
                    group: AiContentDataHelper.DATA_PREFIX,
                    getPath: getDataPath,
                    pathElement: this.displayNameEl,
                });
            }

        });
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

        this.pathEl.onClicked(() => {
            if (this.hasClass(ContentWizardHeader.LOCKED_CLASS)) {
                if (!this.renameDialog) {
                    this.renameDialog = new RenameContentDialog();

                    this.renameDialog.onRenamed((newName: string) => {
                        this.setName(newName, true); // setting silently to avoid duplication check
                        this.nameEl.show(); // using workaround to trigger AutosizeTextInput's resize
                        this.notifyRenamed();
                    });
                }

                this.renameDialog.setInitialPath(this.persistedContent.getPath()).open();
            }
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
        const isUniqueChanged: boolean = !ObjectHelper.booleanEquals(this.isNameUnique, isUnique);

        this.isNameUnique = isUnique;
        this.toggleClass('path-exists', !isUnique);

        if (isUniqueChanged) {
            this.notifyPropertyChanged('unique', '' + !isUnique, '' + isUnique);
        }
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

    setPath(value: string) {
        if (!this.persistedContent) {
            return;
        }
        const isLockedPath = this.hasClass(ContentWizardHeader.LOCKED_CLASS);

        const pathValue = isLockedPath ? this.persistedContent.getPath().toString() : value;
        super.setPath(pathValue);

        if (isLockedPath) {
            this.pathEl.setTitle(i18n('path.lock'));
        }
    }

    setOnline(isOnline: boolean) {
        this.toggleClass(ContentWizardHeader.LOCKED_CLASS, isOnline);
        this.toggleNameGeneration(!isOnline);
        this.nameEl.setVisible(!isOnline);
    }

    isValid(): boolean {
        return super.isValid() && this.isNameUnique;
    }

    toggleNameInput(enable: boolean): void {
        if (enable && this.hasClass(ContentWizardHeader.LOCKED_CLASS)) {
            return;
        }

        super.toggleNameInput(enable);
    }

    isValidForSaving(): boolean {
        return !!this.getName() && this.isNameUnique;
    }

    isDisplayNameInputDirty(): boolean {
        return this.displayNameEl.isDirty();
    }

    isNameInputDirty(): boolean {
        return this.nameEl.isDirty();
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
            this.bottomRow.appendChild(this.loadSpinner);

            return rendered;
        });
    }

    onNameCheckIsOn(listener: () => void) {
        this.nameCheckIsOnListeners.push(listener);
    }

    unNameCheckIsOn(listener: () => void) {
        this.nameCheckIsOnListeners = this.nameCheckIsOnListeners.filter((curr:  () => void) => {
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
        this.nameCheckIsOffListeners = this.nameCheckIsOffListeners.filter((curr:  () => void) => {
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
        this.renamedListeners = this.renamedListeners.filter((curr:  () => void) => {
            return curr !== listener;
        });
        return this;
    }

    private notifyRenamed() {
        this.renamedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    updateByContent(content: Content, silent?: boolean): void {
        const isAutoGenerationEnabled: boolean = this.isAutoGenerationEnabled();

        if (isAutoGenerationEnabled) {
            this.setAutoGenerationEnabled(false);
        }

        if (!this.isDisplayNameInputDirty()) {
            this.setDisplayName(content.getDisplayName(), silent);
        }

        if (!this.isNameInputDirty()) {
            this.setName(content.getName().toString(), silent);
        }

        if (isAutoGenerationEnabled) {
            this.setAutoGenerationEnabled(true);
        }

        const path: string = content.getPath().getParentPath().isRoot() ? '/' : `${content.getPath().getParentPath().toString()}/`;
        this.setPath(path);
    }

    private getAiDataPath(): PropertyPath {
        return PropertyPath.fromString(`/${AiContentDataHelper.TOPIC}`);
    }
}
