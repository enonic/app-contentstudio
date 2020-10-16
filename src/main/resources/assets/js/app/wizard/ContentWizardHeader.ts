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

export class ContentWizardHeader
    extends WizardHeaderWithDisplayNameAndName {

    private isNameUnique: boolean = true;

    private persistedName: string = '';

    constructor(builder: WizardHeaderWithDisplayNameAndNameBuilder) {
        super(builder);

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        const nameErrorBlock: SpanEl = new SpanEl('path-error');
        nameErrorBlock.setHtml(i18n('path.not.available'));
        this.appendChild(nameErrorBlock);
    }

    private initListeners() {
        const debouncedNameUniqueChecker: () => void = AppHelper.debounce(() => {
            if (this.isNameChanged()) {
                new ContentExistsByPathRequest(this.getName()).sendAndParse().then((exists: boolean) => {
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
                debouncedNameUniqueChecker();
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

        return name !== '' && name !== this.persistedName;
    }

    setPersistedName(value: string) {
        this.persistedName = value;
    }

    isValid(): boolean {
        return super.isValid() && this.isNameUnique;
    }
}
