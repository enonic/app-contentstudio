import {PrincipalComboBox} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {ProjectReadAccessType} from '../../../../data/project/ProjectReadAccessType';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {PrincipalLoader} from '../../../../../security/PrincipalLoader';
import {PrincipalLoader as BasePrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {ProjectReadAccess} from '../../../../data/project/ProjectReadAccess';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';

export class ProjectReadAccessFormItem
    extends ProjectFormItem {

    private principalsCombobox: PrincipalComboBox;

    constructor() {
        super(<ProjectFormItemBuilder>new ProjectFormItemBuilder(new RadioGroup('read-access-radio-group'))
            .setHelpText(i18n('settings.projects.access.helptext'))
            .setLabel(i18n('settings.items.wizard.readaccess.label'))
            .setValidator(Validators.required));

        this.initElements();
        this.initListeners();
        this.addClass('project-read-access-form-item');
    }

    protected initElements(): void {
        const readAccessRadioGroup: RadioGroup = this.getRadioGroup();

        readAccessRadioGroup.addOption(ProjectReadAccessType.PUBLIC, i18n('settings.items.wizard.readaccess.public.description'));
        readAccessRadioGroup.addOption(ProjectReadAccessType.PRIVATE, i18n('settings.items.wizard.readaccess.private.description'));
        readAccessRadioGroup.addOption(ProjectReadAccessType.CUSTOM, i18n('settings.items.wizard.readaccess.custom.description'));

        this.principalsCombobox = this.createPrincipalsCombobox();
        this.principalsCombobox.insertAfterEl(this.getRadioGroup());
        this.principalsCombobox.setEnabled(false);
    }

    protected initListeners(): void {
        this.getRadioGroup().onValueChanged((event: ValueChangedEvent) => {
            const newValue: string = event.getNewValue();
            this.principalsCombobox.setEnabled(newValue === ProjectReadAccessType.CUSTOM);
        });
    }

    getRadioGroup(): RadioGroup {
        return <RadioGroup>this.getInput();
    }

    getPrincipalComboBox(): PrincipalComboBox {
        return this.principalsCombobox;
    }

    private createPrincipalsCombobox(): PrincipalComboBox {
        const loader: BasePrincipalLoader = new PrincipalLoader()
            .setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        const principalsCombobox = <PrincipalComboBox>PrincipalComboBox.create().setLoader(loader).build();

        return principalsCombobox;
    }

    getReadAccess(): ProjectReadAccess {
        const readAccessString: string = this.getRadioGroup().getValue();

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


    setPrincipalComboboxEnabled(value: boolean): void {
        this.principalsCombobox.setEnabled(value && this.getRadioGroup().getValue() === ProjectReadAccessType.CUSTOM);
    }
}
