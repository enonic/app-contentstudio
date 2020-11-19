import {
    WizardHeaderWithDisplayNameAndName,
    WizardHeaderWithDisplayNameAndNameBuilder
} from 'lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {i18n} from 'lib-admin-ui/util/Messages';
import {PropertyChangedEvent} from 'lib-admin-ui/PropertyChangedEvent';
import {ContentExistsByPathRequest} from '../resource/ContentExistsByPathRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {RenameContentDialog} from './RenameContentDialog';
import {Content} from '../content/Content';
import {UpdateContentRequest} from '../resource/UpdateContentRequest';
import {ContentName} from 'lib-admin-ui/content/ContentName';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ContentUnnamed} from 'lib-admin-ui/content/ContentUnnamed';

export class ContentWizardHeader
    extends WizardHeaderWithDisplayNameAndName {

    private isNameUnique: boolean = true;

    private persistedContent: Content;

    private renameDialog: RenameContentDialog;

    private staticNameBlock: SpanEl;

    constructor(builder: WizardHeaderWithDisplayNameAndNameBuilder) {
        super(builder);

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.staticNameBlock = new SpanEl('name-static');
        this.appendChild(this.staticNameBlock);

        const nameErrorBlock: SpanEl = new SpanEl('path-error');
        nameErrorBlock.setHtml(i18n('path.not.available'));
        this.appendChild(nameErrorBlock);

        const lockElem: SpanEl = new SpanEl('lock-name icon-pencil');
        lockElem.setTitle(i18n('path.lock'));
        this.appendChild(lockElem);


        lockElem.onClicked(() => {
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
    }

    private initListeners() {
        let asyncNameChecksRunning: number = 0;

        const debouncedNameUniqueChecker: () => void = AppHelper.debounce(() => {
            if (this.isNameChanged()) {
                asyncNameChecksRunning++;

                new ContentExistsByPathRequest(this.getNewPath().toString()).sendAndParse().then((exists: boolean) => {
                    if (asyncNameChecksRunning === 1 && exists === this.isNameUnique) {
                        this.updateIsNameUnique(!exists || !this.isNameChanged());
                    }

                }).catch(DefaultErrorHandler.handle).finally(() => asyncNameChecksRunning--);
            } else if (!this.isNameUnique) {
                this.updateIsNameUnique(true);
            }
        }, 900);

        this.onPropertyChanged((event: PropertyChangedEvent) => {
            if (event.getPropertyName() === `<${i18n('field.path')}>`) {
                if (this.getName() === '') {
                    this.updateIsNameUnique(true);
                } else {
                    debouncedNameUniqueChecker();
                }

                this.staticNameBlock.setHtml(this.getName());
            }
        });
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
    }

    isValid(): boolean {
        return super.isValid() && this.isNameUnique;
    }

    isValidForSaving(): boolean {
        return !!this.getName() && this.isNameUnique;
    }
}
