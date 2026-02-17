import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {AccessControlComboBox} from '../../../wizard/AccessControlComboBox';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AccessControlEntry} from '../../../access/AccessControlEntry';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {Permission} from '../../../access/Permission';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';

export class MainAccessStep
    extends DialogStep {

    private readonly container: Element;
    private readonly principalsCombobox: AccessControlComboBox;
    private readonly accessModeRadioGroup: RadioGroup;
    private readonly copyFromParentButton: Button;

    private readonly everyoneEntry: AccessControlEntry;

    private isTopLevelItem: boolean;
    private parentPermissions: AccessControlEntry[] = [];
    private originalValues: AccessControlEntry[] = [];

    constructor() {
        super();

        this.container = new SectionEl('main-access-step');
        this.principalsCombobox = new AccessControlComboBox();
        this.principalsCombobox.addClass('principal-combobox');

        this.accessModeRadioGroup = new RadioGroup('read-access-radio-group');
        this.copyFromParentButton = new Button().addClass('copy-from-parent-button') as Button;

        this.everyoneEntry = this.makeEveryoneCanReadAccessControlEntry();

        this.setupPrincipalsCombobox();
        this.setupAccessModeRadioGroup();
    }

    private setupPrincipalsCombobox(): void {
        const principalsAccessContainer = new DivEl('principals-access-container');
        this.container.appendChild(principalsAccessContainer);
        principalsAccessContainer.appendChild(this.principalsCombobox);

        const permissionsLabel = new LabelEl(i18n('dialog.permissions.step.main.permissions.label'), this.principalsCombobox);
        permissionsLabel.insertBeforeEl(this.principalsCombobox);

        this.copyFromParentButton.insertAfterEl(permissionsLabel);

        this.copyFromParentButton.onClicked(() => {
            this.layoutPermissions(this.parentPermissions);
            const hasEveryonePermission = this.parentPermissions.some((item) => item.getPrincipalKey().equals(RoleKeys.EVERYONE));
            this.accessModeRadioGroup.setValue(hasEveryonePermission ? 'public' : 'restricted', true);
            this.copyFromParentButton.setEnabled(false);

            this.notifyDataChanged();
        });

        const updateCopyFromParentButtonEnabled = () => {
            this.copyFromParentButton.setEnabled(this.isUnequalToParentPermissions());
            this.notifyDataChanged();
        };

        this.principalsCombobox.onSelectionChanged(updateCopyFromParentButtonEnabled);
        this.principalsCombobox.onOptionValueChanged(updateCopyFromParentButtonEnabled);
    }

    private setupAccessModeRadioGroup(): void {
        const accessModeContainer = new DivEl('access-mode-container');
        this.container.appendChild(accessModeContainer);
        accessModeContainer.appendChild(this.accessModeRadioGroup);

        const publicButton = this.accessModeRadioGroup.addOption('public', i18n('dialog.permissions.step.main.access.mode.public'));
        const restrictedButton = this.accessModeRadioGroup.addOption('restricted',
            i18n('dialog.permissions.step.main.access.mode.restricted'));

        publicButton.getLastChild().addClass('icon-unlock');
        restrictedButton.getLastChild().addClass('icon-lock');

        const accessModeLabel = new LabelEl(i18n('dialog.permissions.step.main.access.label'), this.accessModeRadioGroup);
        accessModeLabel.insertBeforeEl(this.accessModeRadioGroup);

        this.accessModeRadioGroup.onValueChanged(() => {
            this.copyFromParentButton.setEnabled(this.isUnequalToParentPermissions());
            this.notifyDataChanged();
        });
    }

    getName(): string {
        return 'main-step';
    }

    getDescription(): string {
        return i18n('dialog.permissions.step.main.description');
    }

    getHtmlEl(): Element {
        return this.container;
    }

    private layoutPermissions(permissions: AccessControlEntry[]): void {
        this.principalsCombobox.deselectAll(true);

        const noEveryonePermissions = permissions.filter((item) => !item.getPrincipalKey().equals(RoleKeys.EVERYONE));

        noEveryonePermissions.forEach((item) => {
            this.principalsCombobox.select(item, true);
        });
    }

    setup(originalValues: AccessControlEntry[], parentPermissions: AccessControlEntry[], isTopLevelItem: boolean): void {
        this.isTopLevelItem = isTopLevelItem;
        this.originalValues = originalValues;
        this.parentPermissions = parentPermissions;

        this.layoutPermissions(this.originalValues);

        const hasEveryonePermission = this.originalValues.some((item) => item.getPrincipalKey().equals(RoleKeys.EVERYONE));
        this.accessModeRadioGroup.setValue(hasEveryonePermission ? 'public' : 'restricted', true);
        this.copyFromParentButton.setEnabled(this.isUnequalToParentPermissions());

        this.updateCopyFromParentButtonLabel();
        this.notifyDataChanged();
    }

    getData(): AccessControlEntry[] {
        return this.getCurrentlySelectedPermissions();
    }

    reset(): void {
        this.principalsCombobox.cleanInput();
        this.setup(this.originalValues, this.parentPermissions, this.isTopLevelItem);
    }

    private isPublicAccess(): boolean {
        return this.accessModeRadioGroup.getValue() === 'public';
    }

    private getCurrentlySelectedPermissions(): AccessControlEntry[] {
        const selectedPrincipals = this.principalsCombobox.getSelectedOptions().map((item) => item.getOption().getDisplayValue());
        const perms = this.isPublicAccess() ? [this.everyoneEntry, ...selectedPrincipals] : selectedPrincipals;
        return perms.sort();
    }

    private makeEveryoneCanReadAccessControlEntry(): AccessControlEntry {
        const entry = new AccessControlEntry(Principal.create().setKey(RoleKeys.EVERYONE).setDisplayName('Everyone').build());
        entry.allow(Permission.READ);
        return entry;
    }

    isAnyPermissionChanged(): boolean {
        return !ObjectHelper.arrayEquals(this.getCurrentlySelectedPermissions(), this.originalValues.slice().sort());
    }

    private isUnequalToParentPermissions(): boolean {
        return !ObjectHelper.arrayEquals(this.getCurrentlySelectedPermissions(), this.parentPermissions.slice().sort());
    }

    private updateCopyFromParentButtonLabel(): void {
        this.copyFromParentButton.setLabel(this.isTopLevelItem ? i18n('dialog.permissions.step.main.copy.from.project') : i18n(
            'dialog.permissions.step.main.copy.from.parent'));
    }

}
