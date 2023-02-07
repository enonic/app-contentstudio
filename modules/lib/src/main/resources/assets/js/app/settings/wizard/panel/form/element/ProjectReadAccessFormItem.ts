import {PrincipalComboBox, PrincipalComboBoxBuilder} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {ProjectFormItemBuilder} from './ProjectFormItem';
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
import {ProjectHelper} from '../../../../data/project/ProjectHelper';
import {ProjectPermissions} from '../../../../data/project/ProjectPermissions';
import * as Q from 'q';
import {GetPrincipalsByKeysRequest} from '../../../../../security/GetPrincipalsByKeysRequest';
import {CopyFromParentFormItem} from './CopyFromParentFormItem';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';

export class ProjectReadAccessFormItem
    extends CopyFromParentFormItem {

    private principalsCombobox: ExtendedPrincipalComboBox;

    constructor() {
        super(
            <ProjectFormItemBuilder>new ProjectFormItemBuilder(
                new RadioGroup('read-access-radio-group'))
                .setHelpText(i18n('settings.projects.access.helptext'))
                .setLabel(i18n('settings.items.wizard.readaccess.label'))
                .setValidator(Validators.required)
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
            this.principalsCombobox.setEnabled(newValue === ProjectReadAccessType.CUSTOM);
            this.updateCopyButtonState();
        });

        this.principalsCombobox.onValueChanged(() => {
            this.updateCopyButtonState();
        });
    }

    layoutReadAccess(readAccess: ProjectReadAccess, permissions: ProjectPermissions, silent: boolean = true): Q.Promise<void> {
        this.getRadioGroup().setValue(readAccess.getType(), silent);

        this.updateFilteredPrincipalsByPermissions(permissions);

        return new GetPrincipalsByKeysRequest(readAccess.getPrincipalsKeys()).sendAndParse().then((principals: Principal[]) => {
            principals.forEach((principal: Principal) => {
                this.getPrincipalComboBox().select(principal, false, silent);
                this.getPrincipalComboBox().resetBaseValues();
            });

            return Q(null);
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
        const principalsLoader: PrincipalLoader = <PrincipalLoader>this.getPrincipalComboBox().getLoader();
        principalsLoader.skipPrincipals(principals);
    }

    private getDefaultFilteredPrincipals(): PrincipalKey[] {
        return [PrincipalKey.ofAnonymous()];
    }

    getRadioGroup(): RadioGroup {
        return <RadioGroup>this.getInput();
    }

    getPrincipalComboBox(): PrincipalComboBox {
        return this.principalsCombobox;
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

    getReadAccessType(): ProjectReadAccessType {
        const readAccessString: string = this.getRadioGroup().getValue();

        if (readAccessString === ProjectReadAccessType.PUBLIC) {
            return ProjectReadAccessType.PUBLIC;
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM) {
            return ProjectReadAccessType.CUSTOM;
        }

        return ProjectReadAccessType.PRIVATE;
    }


    setPrincipalComboboxEnabled(value: boolean): void {
        this.principalsCombobox?.setEnabled(value && this.getRadioGroup().getValue() === ProjectReadAccessType.CUSTOM);
    }

    protected doCopyFromParent(): void {
        this.layoutReadAccess(this.parentProject.getReadAccess(), this.parentProject.getPermissions(), false).then(() => {
            this.notifyAccessCopiedFromParent();
            return Q.resolve();
        });
    }

    private notifyAccessCopiedFromParent(): void {
        NotifyManager.get().showSuccess(
            i18n('settings.wizard.project.copy.success', i18n('settings.items.wizard.readaccess.label'),
                this.parentProject.getDisplayName()));
    }

    updateCopyButtonState(): void {
        this.copyFromParentButton?.setEnabled(this.isCopyButtonToBeEnabled());
    }

    private isCopyButtonToBeEnabled(): boolean {
        if (!ProjectHelper.isAvailable(this.parentProject)) {
            return false;
        }

        if (!this.getRadioGroup().getValue()) {
            return true;
        }

        if (!this.parentProject.getReadAccess().equals(this.getReadAccess())) {
            return true;
        }

        return false;
    }

    clean(): void {
        if (this.getReadAccessType() !== ProjectReadAccessType.CUSTOM) {
            this.principalsCombobox.clearSelection();
        }
    }
}

class ExtendedPrincipalComboBox
    extends PrincipalComboBox {

    constructor() {
        const loader: BasePrincipalLoader = new PrincipalLoader()
            .setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        super(<PrincipalComboBoxBuilder>PrincipalComboBox.create().setLoader(loader));
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
