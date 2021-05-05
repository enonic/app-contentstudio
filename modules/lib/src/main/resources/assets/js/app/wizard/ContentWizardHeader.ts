import {
    WizardHeaderWithDisplayNameAndName,
    WizardHeaderWithDisplayNameAndNameOptions
} from 'lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {i18n} from 'lib-admin-ui/util/Messages';
import {PropertyChangedEvent} from 'lib-admin-ui/PropertyChangedEvent';
import {ContentExistsByPathRequest} from '../resource/ContentExistsByPathRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {RenameContentDialog} from './RenameContentDialog';
import {Content} from '../content/Content';
import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ButtonEl} from 'lib-admin-ui/dom/ButtonEl';
import {ContentName} from '../content/ContentName';
import {ContentUnnamed} from '../content/ContentUnnamed';
import {ContentPath} from '../content/ContentPath';

export class ContentWizardHeader
    extends WizardHeaderWithDisplayNameAndName {

    private isNameUnique: boolean = true;

    private persistedContent: Content;

    private renameDialog: RenameContentDialog;

    private asyncNameChecksRunning: number = 0;

    private debouncedNameUniqueChecker: () => void;

    private lockElem: ButtonEl;

    constructor(options?: WizardHeaderWithDisplayNameAndNameOptions) {
        super(options);
    }

    protected initElements() {
        super.initElements();
        this.lockElem = new ButtonEl();
    }

    protected initListeners() {
        super.initListeners();

        this.onPropertyChanged((event: PropertyChangedEvent) => {
            if (event.getPropertyName() === `<${i18n('field.path')}>`) {
                if (this.getName() === '') {
                    this.updateIsNameUnique(true);
                } else {
                    this.debouncedNameUniqueChecker();
                }
            }
        });

        this.lockElem.onClicked(() => {
            console.log('clickz');

            if (!this.renameDialog) {
                this.renameDialog = new RenameContentDialog();

                this.renameDialog.onRenamed((newName: string) => {
                    this.setOnline(false);
                    this.setName(newName);

                    const contentName: ContentName = StringHelper.isBlank(newName) ? ContentUnnamed.newUnnamed() : new ContentName(newName);
                    UpdateContentRequest.create(this.persistedContent).setContentName(contentName).sendAndParse().then(() => {
                        showFeedback(i18n('notify.wizard.contentRenamed'));
                    }).catch(DefaultErrorHandler.handle);
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

                }).catch(DefaultErrorHandler.handle).finally(() => this.asyncNameChecksRunning--);
            } else if (!this.isNameUnique) {
                this.updateIsNameUnique(true);
            }
        }, 900);
    }

    refreshNameUniqueness() {
        if (this.isNameChanged()) {
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
        return ContentPath.fromParent(this.persistedContent.getPath().getParentPath(), this.getName());
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const nameErrorBlock: SpanEl = new SpanEl('path-error');
            nameErrorBlock.setHtml(i18n('path.not.available'));
            this.bottomRow.appendChild(nameErrorBlock);

            this.lockElem.addClass('lock-name icon-pencil');
            this.lockElem.setTitle(i18n('path.lock'));
            this.bottomRow.appendChild(this.lockElem);

            return rendered;
        });
    }
}
