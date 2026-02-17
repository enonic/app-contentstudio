import {ProjectHelper} from '../../../../data/project/ProjectHelper';
import {type ProjectPermissions} from '../../../../data/project/ProjectPermissions';
import {ProjectReadAccess} from '../../../../data/project/ProjectReadAccess';
import {ProjectReadAccessType} from '../../../../data/project/ProjectReadAccessType';
import {type PrincipalComboBox} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {ProjectFormItemBuilder} from './ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {type ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import type Q from 'q';
import {GetPrincipalsByKeysRequest} from '../../../../../security/GetPrincipalsByKeysRequest';
import {CopyFromParentFormItem} from './CopyFromParentFormItem';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {CSPrincipalCombobox} from '../../../../../security/CSPrincipalCombobox';

export class ProjectReadAccessFormItem
    extends CopyFromParentFormItem {

    private principalsCombobox: ExtendedPrincipalComboBox;

    constructor() {
        super(
            new ProjectFormItemBuilder(
                new RadioGroup('read-access-radio-group'))
                .setHelpText(i18n('settings.projects.access.helptext'))
                .setLabel(i18n('settings.items.wizard.readaccess.label'))
                .setValidator(Validators.required) as ProjectFormItemBuilder
        );

        this.initElements();
        this.initListeners();
        this.addClass('project-read-access-form-item');
    }

    protected initElements(): void {
        const readAccessRadioGroup: RadioGroup = this.getRadioGroup();

        readAccessRadioGroup.addOption(ProjectReadAccessType.PUBLIC, i18n('settings.items.wizard.readaccess.public.description'));
        readAccessRadioGroup.addOption(ProjectReadAccessType.PRIVATE, i18n('settings.items.wizard.readaccess.private.description'));
        readAccessRadioGroup.addOption(ProjectReadAccessType.CUSTOM, i18n('settings.items.wizard.readaccess.custom.description'));

        this.principalsCombobox = new ExtendedPrincipalComboBox();
        this.principalsCombobox.insertAfterEl(this.getRadioGroup());
        this.principalsCombobox.setEnabled(false);

        this.filterPrincipals(this.getDefaultFilteredPrincipals());
    }

    protected initListeners(): void {
        this.getRadioGroup().onValueChanged((event: ValueChangedEvent) => {
            const newValue: string = event.getNewValue();
            this.principalsCombobox.setEnabled(newValue === ProjectReadAccessType.CUSTOM.toString());
            this.updateCopyButtonState();
        });

        this.principalsCombobox.onSelectionChanged(() => {
            this.updateCopyButtonState();
        });
    }

    layoutReadAccess(readAccess: ProjectReadAccess, permissions: ProjectPermissions, silent: boolean = true): Q.Promise<void> {
        this.getRadioGroup().setValue(readAccess.getType(), silent);

        this.updateFilteredPrincipalsByPermissions(permissions);

        return new GetPrincipalsByKeysRequest(readAccess.getPrincipalsKeys()).sendAndParse().then((principals: Principal[]) => {
            this.getPrincipalComboBox().select(principals, silent);
        }).catch(DefaultErrorHandler.handle);
    }

    private updateFilteredPrincipalsByPermissions(permissions: ProjectPermissions) {
        this.filterPrincipals([
            ...permissions.getContributors(),
            ...permissions.getAuthors(),
            ...permissions.getEditors(),
            ...permissions.getOwners(),
            ...this.getDefaultFilteredPrincipals()
        ]);
    }

    private filterPrincipals(principals: PrincipalKey[]) {
        const principalsLoader = this.getPrincipalComboBox().getLoader();
        principalsLoader.skipPrincipals(principals);
    }

    private getDefaultFilteredPrincipals(): PrincipalKey[] {
        return [PrincipalKey.ofAnonymous()];
    }

    getRadioGroup(): RadioGroup {
        return this.getInput() as RadioGroup;
    }

    getPrincipalComboBox(): PrincipalComboBox {
        return this.principalsCombobox;
    }

    getReadAccess(): ProjectReadAccess {
        const readAccessString: string = this.getRadioGroup().getValue();

        if (readAccessString === ProjectReadAccessType.PUBLIC.toString()) {
            return new ProjectReadAccess(ProjectReadAccessType.PUBLIC);
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM.toString()) {
            const principals: PrincipalKey[] =
                this.principalsCombobox.getSelectedOptions().map((option) => option.getOption().getDisplayValue().getKey());

            if (principals.length === 0) {
                return new ProjectReadAccess(ProjectReadAccessType.PRIVATE);
            }

            return new ProjectReadAccess(ProjectReadAccessType.CUSTOM, principals);
        }

        return new ProjectReadAccess(ProjectReadAccessType.PRIVATE);
    }

    getReadAccessType(): ProjectReadAccessType {
        const readAccessString: string = this.getRadioGroup().getValue();

        if (readAccessString === ProjectReadAccessType.PUBLIC.toString()) {
            return ProjectReadAccessType.PUBLIC;
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM.toString()) {
            return ProjectReadAccessType.CUSTOM;
        }

        return ProjectReadAccessType.PRIVATE;
    }


    setPrincipalComboboxEnabled(value: boolean): void {
        this.principalsCombobox?.setEnabled(value && this.getRadioGroup().getValue() === ProjectReadAccessType.CUSTOM.toString());
    }

    protected doCopyFromParent(): void {
        const parentProject = this.parentProjects[0];
        this.layoutReadAccess(parentProject.getReadAccess(), parentProject.getPermissions(), false).then(() => {
            this.notifyAccessCopiedFromParent();
        });
    }

    private notifyAccessCopiedFromParent(): void {
        const parentProject = this.parentProjects[0];
        const accessLabel = i18n('settings.items.wizard.readaccess.label');
        NotifyManager.get().showSuccess(i18n('settings.wizard.project.copy.success', accessLabel, parentProject.getDisplayName()));
    }

    updateCopyButtonState(): void {
        this.copyFromParentButton?.setEnabled(this.isCopyButtonToBeEnabled());
    }

    private isCopyButtonToBeEnabled(): boolean {
        const parentProject = this.parentProjects?.[0];

        if (!ProjectHelper.isAvailable(parentProject)) {
            return false;
        }

        if (!this.getRadioGroup().getValue()) {
            return true;
        }

        return !parentProject.getReadAccess().equals(this.getReadAccess());
    }

    clean(): void {
        if (this.getReadAccessType() !== ProjectReadAccessType.CUSTOM) {
            this.principalsCombobox.setSelectedItems([]);
        }
    }
}

class ExtendedPrincipalComboBox
    extends CSPrincipalCombobox {

    constructor() {
        super({
            allowedTypes: [PrincipalType.USER, PrincipalType.GROUP],
        });
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);

        if (enable) {
            this.show();
        } else if (this.countSelected() === 0) {
            this.hide();
        }
    }
}
