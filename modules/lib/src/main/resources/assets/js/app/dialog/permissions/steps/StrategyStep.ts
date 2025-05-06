import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {RadioButton} from '@enonic/lib-admin-ui/ui/RadioButton';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {ApplyPermissionsStrategy} from '../PermissionsData';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {AccessControlChangedItem, AccessControlChangedItemsList, AccessControlChangedPermissions} from '../AccessControlChangedItemsList';
import {AccessControlEntry} from '../../../access/AccessControlEntry';
import {Permission} from '../../../access/Permission';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';

export class StrategyStep extends DialogStep {

    private readonly container: Element;
    private readonly strategyRadioGroup: RadioGroup;
    private readonly mergeRadioButton: RadioButton;
    private readonly resetRadioButton: RadioButton;
    private readonly toggleDetailsButton: ShowHideDetailsButton;
    private readonly changedItemsList: AccessControlChangedItemsList;

    private originalValues: AccessControlEntry[] = [];
    private currentValues: AccessControlEntry[] = [];

    constructor() {
        super();

        this.container = new SectionEl('strategy-step');
        this.strategyRadioGroup = new RadioGroup('strategy-radio-group');
        this.mergeRadioButton = this.strategyRadioGroup.addOption('merge', i18n('dialog.permissions.step.strategy.merge'));
        this.resetRadioButton = this.strategyRadioGroup.addOption('reset', i18n('dialog.permissions.step.strategy.reset'));
        this.toggleDetailsButton = new ShowHideDetailsButton();
        this.changedItemsList = new AccessControlChangedItemsList();
        this.setupStrategyRadioGroup();
    }

    getName(): string {
        return 'strategy';
    }

    getDescription(): string {
        return i18n('dialog.permissions.step.strategy.description')
    }

    getHtmlEl(): Element {
        return this.container;
    }

    getData(): { strategy: ApplyPermissionsStrategy } {
        return {
            strategy: this.strategyRadioGroup.getValue() as ApplyPermissionsStrategy
        };
    }

    reset(): void {
        this.strategyRadioGroup.setValue('merge', true);
        this.toggleDetailsButton.setActive(false);
    }

    setup(originalValues: AccessControlEntry[]): void {
        this.originalValues = originalValues;
    }

    setStrategy(val: ApplyPermissionsStrategy): void {
        this.strategyRadioGroup.setValue(val, true);
    }

    setCurrentlySelectedItems(items: AccessControlEntry[]): void {
        this.currentValues = items;
        this.changedItemsList.setItems(this.getChangedItems());
        this.toggleDetailsButton.setVisible(this.changedItemsList.getItemCount() > 0);
    }

    private setupStrategyRadioGroup(): void {
        this.setupApplyToRadioGroup();
        this.setupDetailsContainer();
        this.reset();
    }

    private setupApplyToRadioGroup(): void {
        const applyToContainer = new DivEl('strategy-step-container');
        this.container.appendChild(applyToContainer);
        applyToContainer.appendChild(this.strategyRadioGroup);

        const applyToLabel = new LabelEl(i18n('dialog.permissions.step.strategy.label'), this.strategyRadioGroup);
        applyToLabel.insertBeforeEl(this.strategyRadioGroup);
    }

    private setupDetailsContainer(): void {
        const detailsContainer = new DivEl('strategy-details-container');
        this.container.appendChild(detailsContainer);

        detailsContainer.appendChild(this.toggleDetailsButton);

        this.toggleDetailsButton.onClicked(() => {
            this.toggleDetailsButton.toggle();
        });

        detailsContainer.appendChild(this.changedItemsList);

        this.toggleDetailsButton.setActiveChangeListener((isActive: boolean) => {
            this.changedItemsList.setVisible(isActive);
        });
    }

    private getChangedItems(): AccessControlChangedItem[] {
        const result: AccessControlChangedItem[] = [];

        this.originalValues.forEach((originalVal) => {
            const found = this.currentValues.find((currentVal) => originalVal.getPrincipalKey().equals(currentVal.getPrincipalKey()));
            if (found) {
                if (!originalVal.equals(found)) { // item was changed
                    result.push(new AccessControlChangedItem(originalVal.getPrincipal(),
                        {persisted: originalVal.getAllowedPermissions(), updated: found.getAllowedPermissions()}));
                }
            } else { // item was removed
                if (!RoleKeys.isEveryone(originalVal.getPrincipalKey())) {
                    result.push(new AccessControlChangedItem(originalVal.getPrincipal(), {persisted: originalVal.getAllowedPermissions()}));
                }
            }
        });

        // check for newly added items
        this.currentValues.forEach((currentValue) => {
            const found = this.originalValues.find((originalVal) => originalVal.getPrincipalKey().equals(currentValue.getPrincipalKey()));
            if (!found && !RoleKeys.isEveryone(currentValue.getPrincipalKey())) { // item was added
                result.push(new AccessControlChangedItem(currentValue.getPrincipal(), {updated: currentValue.getAllowedPermissions()}));
            }
        });

        return result;
    }
}

class ShowHideDetailsButton extends Button {

    private active: boolean;

    private onActiveChange?: (isActive: boolean) => void;

    constructor() {
        super(i18n('dialog.permissions.details.hide'));

        this.active = true;
    }

    setActive(active: boolean): void {
        if (this.active === active) {
            return;
        }

        this.active = active;
        this.updateLabel();
        this.onActiveChange(active);
    }

    setActiveChangeListener(onActiveChange: (isActive: boolean) => void): void {
        this.onActiveChange = onActiveChange;
    }

    toggle(): void {
        this.setActive(!this.active);
    }

    private updateLabel(): void {
        this.setLabel(this.active ? i18n('dialog.permissions.details.hide') : i18n('dialog.permissions.details.show'));
    }

}
