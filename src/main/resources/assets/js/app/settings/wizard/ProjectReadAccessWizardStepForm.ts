import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import * as Q from 'q';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {RadioGroup} from 'lib-admin-ui/ui/RadioGroup';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Validators} from 'lib-admin-ui/ui/form/Validators';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {PrincipalComboBox} from 'lib-admin-ui/ui/security/PrincipalComboBox';
import {ValueChangedEvent} from 'lib-admin-ui/ValueChangedEvent';
import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {ProjectReadAccess, ProjectReadAccessType} from '../data/project/ProjectReadAccess';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Principal} from 'lib-admin-ui/security/Principal';
import {GetPrincipalsByKeysRequest} from 'lib-admin-ui/security/GetPrincipalsByKeysRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ProjectPermissions} from '../data/project/ProjectPermissions';
import {FilterablePrincipalLoader} from 'lib-admin-ui/security/FilterablePrincipalLoader';

export class ProjectReadAccessWizardStepForm
    extends SettingDataItemWizardStepForm<ProjectViewItem> {

    private readAccessRadioGroup: RadioGroup;

    private readAccessRadioGroupFormItem: FormItem;

    private principalsCombobox: PrincipalComboBox;

    constructor() {
        super();
    }

    layout(item: ProjectViewItem) {
        const readAccess: ProjectReadAccess = item.getData().getReadAccess();
        this.readAccessRadioGroup.setValue(readAccess.getType(), true);

        this.updateFilteredPrincipalsByPermissions(item.getPermissions());

        if (readAccess.getType() === ProjectReadAccessType.CUSTOM) {
            this.enablePrincipalCombobox();

            new GetPrincipalsByKeysRequest(readAccess.getPrincipals()).sendAndParse().then((principals: Principal[]) => {
                principals.forEach((principal: Principal) => {
                    this.principalsCombobox.select(principal);
                });
            }).catch(DefaultErrorHandler.handle);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-read-access-wizard-step-form');

            return rendered;
        });
    }

    isValid(): boolean {
        return !!this.readAccessRadioGroup.getValue();
    }

    getReadAccess(): ProjectReadAccess {
        const readAccessString: string = this.readAccessRadioGroup.getValue();

        if (readAccessString === ProjectReadAccessType.PUBLIC) {
            return new ProjectReadAccess(ProjectReadAccessType.PUBLIC);
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM) {
            const principals: PrincipalKey[] =
                this.principalsCombobox.getSelectedDisplayValues().map((principal: Principal) => principal.getKey());

            if (principals.length === 0) {
                return new ProjectReadAccess(ProjectReadAccessType.PRIVATE);
            }

            return new ProjectReadAccess(ProjectReadAccessType.CUSTOM, principals);
        }

        return new ProjectReadAccess(ProjectReadAccessType.PRIVATE);
    }

    updateFilteredPrincipalsByPermissions(permissions: ProjectPermissions) {
        this.filterPrincipals([
            ...permissions.getEditors(),
            ...permissions.getContributors(),
            ...permissions.getOwners(),
            ...this.getDefaultFilteredPrincipals()
        ]);
    }

    protected getFormItems(): FormItem[] {
        return [this.createReadAccessRadioGroupFormItem(), this.createPrincipalFormItem()];
    }

    private createReadAccessRadioGroupFormItem(): FormItem {
        this.readAccessRadioGroup = new RadioGroup('read-access-radio-group');

        this.readAccessRadioGroup.addOption('private', i18n('settings.items.wizard.readaccess.private'));
        this.readAccessRadioGroup.addOption('public', i18n('settings.items.wizard.readaccess.public'));
        this.readAccessRadioGroup.addOption('custom', i18n('settings.items.wizard.readaccess.custom'));

        this.readAccessRadioGroupFormItem = new FormItemBuilder(this.readAccessRadioGroup)
            .setLabel(i18n('settings.items.wizard.readaccess.label'))
            .setValidator(Validators.required)
            .build();

        return this.readAccessRadioGroupFormItem;
    }

    private createPrincipalFormItem(): FormItem {
        const loader: FilterablePrincipalLoader = <FilterablePrincipalLoader>new FilterablePrincipalLoader()
            .setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);

        this.principalsCombobox = <PrincipalComboBox>PrincipalComboBox.create().setLoader(loader).build();
        this.filterPrincipals(this.getDefaultFilteredPrincipals());
        this.disablePrincipalCombobox();

        return new FormItemBuilder(this.principalsCombobox).build();
    }

    private getDefaultFilteredPrincipals(): PrincipalKey[] {
        return [PrincipalKey.ofAnonymous()];
    }

    private filterPrincipals(principals: PrincipalKey[]) {
        const principalsLoader: FilterablePrincipalLoader = <FilterablePrincipalLoader>this.principalsCombobox.getLoader();
        principalsLoader.resetSkippedPrincipals().skipPrincipals(principals);
    }

    private disablePrincipalCombobox() {
        this.principalsCombobox.getComboBox().setEnabled(false);
        this.principalsCombobox.addClass('disabled');
    }

    private enablePrincipalCombobox() {
        this.principalsCombobox.getComboBox().setEnabled(true);
        this.principalsCombobox.removeClass('disabled');
    }

    protected initListeners() {
        this.readAccessRadioGroup.onValueChanged((event: ValueChangedEvent) => {
            const newValue: string = event.getNewValue();

            if (newValue === 'private' || newValue === 'public') {
                this.disablePrincipalCombobox();
            } else {
                this.enablePrincipalCombobox();
            }

            this.readAccessRadioGroupFormItem.validate(new ValidationResult(), true);

            this.notifyDataChanged();
        });

        this.principalsCombobox.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

}
