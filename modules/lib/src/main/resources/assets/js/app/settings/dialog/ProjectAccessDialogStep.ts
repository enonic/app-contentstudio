import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {ProjectFormItemBuilder} from '../wizard/panel/form/element/ProjectFormItem';
import {PrincipalComboBox} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {PrincipalLoader as BasePrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {PrincipalLoader} from '../../security/PrincipalLoader';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {ProjectDialogStep} from './ProjectDialogStep';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import * as Q from 'q';
import {ProjectAccessData} from './ProjectAccessData';
import {ProjectReadAccessType} from '../data/project/ProjectReadAccessType';

export class ProjectAccessDialogStep
    extends ProjectDialogStep {

    private readAccessRadioGroup: RadioGroup;

    private principalsCombobox: PrincipalComboBox;

    protected createFormItems(): FormItem[] {
        return [this.createFormItem()];
    }

    private createRadioGroup(): void {
        this.readAccessRadioGroup = new RadioGroup('read-access-radio-group');
        this.readAccessRadioGroup.addOption(ProjectReadAccessType.PUBLIC, i18n('settings.items.wizard.readaccess.public.description'));
        this.readAccessRadioGroup.addOption(ProjectReadAccessType.PRIVATE, i18n('settings.items.wizard.readaccess.private.description'));
        this.readAccessRadioGroup.addOption(ProjectReadAccessType.CUSTOM, i18n('settings.items.wizard.readaccess.custom.description'));
    }

    private createFormItem(): FormItem {
        this.createRadioGroup();

        const readAccessRadioGroupFormItem: FormItem = new ProjectFormItemBuilder(this.readAccessRadioGroup)
            .setHelpText(i18n('settings.projects.access.helptext'))
            .setLabel(i18n('settings.items.wizard.readaccess.label'))
            .setValidator(Validators.required)
            .build();

        readAccessRadioGroupFormItem.addClass('read-access');

        this.createPrincipalCombobox();

        return readAccessRadioGroupFormItem;
    }

    private createPrincipalCombobox(): void {
        this.principalsCombobox = this.createPrincipalsCombobox();
        this.principalsCombobox.insertAfterEl(this.readAccessRadioGroup);
        this.principalsCombobox.setEnabled(false);
    }

    private createPrincipalsCombobox(): PrincipalComboBox {
        const loader: BasePrincipalLoader = new PrincipalLoader()
            .setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        const principalsCombobox = <PrincipalComboBox>PrincipalComboBox.create().setLoader(loader).build();

        return principalsCombobox;
    }

    protected listenItemsEvents(): void {
        super.listenItemsEvents();

        this.readAccessRadioGroup.onValueChanged((event: ValueChangedEvent) => {
            const newValue: string = event.getNewValue();
            this.principalsCombobox.setEnabled(newValue === ProjectReadAccessType.CUSTOM);
            this.notifyDataChanged();
        });

        this.principalsCombobox.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    getData(): Object {
        const readAccessString: string = this.readAccessRadioGroup.getValue();

        const result: Object = {
            access: readAccessString
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM) {
            result['principals'] = this.principalsCombobox.getSelectedDisplayValues().map((principal: Principal) => principal.getKey());
        }

        return result;
    }

    getReadAccess(): ProjectAccessData {
        if (!this.readAccessRadioGroup) {
            return null;
        }

        const readAccessString: string = this.readAccessRadioGroup.getValue();

        if (readAccessString === ProjectReadAccessType.PUBLIC) {
            return new ProjectAccessData(ProjectReadAccessType.PUBLIC);
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM) {
            const principals: Principal[] =
                this.principalsCombobox.getSelectedDisplayValues();

            if (principals.length === 0) {
                return new ProjectAccessData(ProjectReadAccessType.PRIVATE);
            }

            return new ProjectAccessData(ProjectReadAccessType.CUSTOM, principals);
        }

        return new ProjectAccessData(ProjectReadAccessType.PRIVATE);
    }

    protected getFormClass(): string {
        return 'project-read-access-step';
    }

    hasData(): boolean {
        return !!this.readAccessRadioGroup.getValue();
    }

    isValid(): Q.Promise<boolean> {
        return Q.resolve(this.hasData());
    }

    isOptional(): boolean {
        return false;
    }

    getName(): string {
        return 'projectAccess';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.access.description');
    }
}
