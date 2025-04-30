import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {RadioButton} from '@enonic/lib-admin-ui/ui/RadioButton';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {ApplyPermissionsScope} from '../PermissionsData';
import {Checkbox} from '@enonic/lib-admin-ui/ui/Checkbox';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';

export class StrategyStep
    extends DialogStep {

    private readonly container: Element;

    private readonly applyToRadioGroup: RadioGroup;
    private readonly childrenOnlyRadioButton: RadioButton;
    private readonly itemAndChildrenRadioButton: RadioButton;
    private readonly itemOnlyRadioButton: RadioButton;

    private readonly strategyContainer: Element;
    private readonly strategyCheckbox: Checkbox;

    private confirmOverwriteDialog: ConfirmationDialog;
    private resetConfirmedHandler: () => void;

    constructor() {
        super();

        this.container = new SectionEl('strategy-step');

        this.applyToRadioGroup = new RadioGroup('apply-to-access-radio-group');
        this.itemOnlyRadioButton = this.applyToRadioGroup.addOption('single', `${i18n('dialog.permissions.step.apply.to.item')} (1)`);
        this.childrenOnlyRadioButton = this.applyToRadioGroup.addOption('subtree', i18n('dialog.permissions.step.apply.to.children'));
        this.itemAndChildrenRadioButton = this.applyToRadioGroup.addOption('tree', i18n('dialog.permissions.step.apply.to.all'));
        this.setupApplyToRadioGroup();

        this.strategyCheckbox = Checkbox.create().setName('strategy').setLabelText(i18n('dialog.permissions.step.strategy.overwrite')).build();
        this.strategyContainer = new DivEl('strategy-step-container');
        this.setupStrategyContainer();

        this.reset();
    }

    private setupApplyToRadioGroup(): void {
        const applyToContainer = new DivEl('apply-to-step-container');
        this.container.appendChild(applyToContainer);

        const applyToLabel = new LabelEl(i18n('dialog.permissions.step.apply.label'), this.applyToRadioGroup);
        applyToContainer.appendChild(applyToLabel);
        applyToContainer.appendChild(this.applyToRadioGroup);

        this.applyToRadioGroup.onValueChanged(() => {
            this.updateStrategyRadioGroup();
            this.notifyDataChanged();
        });
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

    getData(): { applyTo: ApplyPermissionsScope, reset: boolean } {
        return {
            applyTo: this.applyToRadioGroup.getValue() as ApplyPermissionsScope,
            reset: this.strategyCheckbox.isChecked()
        };
    }

    setResetConfirmedHandler(handler: () => void): void {
        this.resetConfirmedHandler = handler;
    }

    reset(): void {
        this.applyToRadioGroup.setValue('single', true);
        this.strategyCheckbox.setChecked(false, true);
    }

    setTotalChildren(totalChildren: number): void {
        const hasChildren = totalChildren > 0;

        this.applyToRadioGroup.setValue('single', true);
        this.itemAndChildrenRadioButton.setLabel(`${i18n('dialog.permissions.step.apply.to.all')} (${totalChildren + 1})`);
        this.childrenOnlyRadioButton.setLabel(
            i18n('dialog.permissions.step.apply.to.children') + (hasChildren ? ` (${totalChildren})` : ''));
        this.itemAndChildrenRadioButton.setEnabled(hasChildren);
        this.childrenOnlyRadioButton.setEnabled(hasChildren);

        this.updateStrategyRadioGroup();
    }

    private setupStrategyContainer(): void {
        this.setupStrategyRadioGroup();

        this.strategyCheckbox.onValueChanged(() => {
            if (this.strategyCheckbox.isChecked()) {
                this.confirmOverwriteDialog = this.confirmOverwriteDialog ?? new ConfirmationDialog()
                    .setQuestion(i18n('dialog.permissions.confirm.overwrite.question'))
                    .setNoCallback(() => {
                        this.strategyCheckbox.setChecked(false, true);
                    });

                this.confirmOverwriteDialog.open();
            }

            this.notifyDataChanged();
        });
    }

    private setupStrategyRadioGroup(): void {
        this.container.appendChild(this.strategyContainer);
        this.strategyContainer.appendChild(this.strategyCheckbox);
    }

    private updateStrategyRadioGroup(): void {
        const applyToValue = this.applyToRadioGroup.getValue() as ApplyPermissionsScope;
        this.strategyCheckbox.setChecked(false, true);
        this.strategyContainer.setVisible(applyToValue !== 'single');
    }
}
