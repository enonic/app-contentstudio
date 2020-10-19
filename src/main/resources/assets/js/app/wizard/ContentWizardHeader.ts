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

export class ContentWizardHeader
    extends WizardHeaderWithDisplayNameAndName {

    private isNameUnique: boolean = true;

    private persistedPath: ContentPath;

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

        const lockElem: SpanEl = new SpanEl('lock-name icon-lock');
        lockElem.setTitle(i18n('path.lock'));
        this.appendChild(lockElem);


        lockElem.onClicked(() => {
            if (!this.renameDialog) {
                this.renameDialog = new RenameContentDialog();

                this.renameDialog.onRenamed((newName: string) => {
                    this.setName(newName);
                });
            }

            this.renameDialog.setInitialPath(this.persistedPath).setCurrentPath(this.getNewPath()).open();
        });
    }

    private initListeners() {
        const debouncedNameUniqueChecker: () => void = AppHelper.debounce(() => {
            if (this.isNameChanged()) {
                new ContentExistsByPathRequest(this.getNewPath().toString()).sendAndParse().then((exists: boolean) => {
                    if (exists === this.isNameUnique) {
                        this.updateIsNameUnique(!exists);
                    }
                }).catch(DefaultErrorHandler.handle);
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

        return name !== '' && name !== this.persistedPath.getName();
    }

    private getNewPath(): ContentPath {
        return ContentPath.fromParent(this.persistedPath.getParentPath(), this.getName());
    }

    setPersistedPath(value: ContentPath) {
        this.persistedPath = value;
    }

    setOnline(value: boolean) {
        this.toggleClass('locked', value);
    }

    isValid(): boolean {
        return super.isValid() && this.isNameUnique;
    }
}
