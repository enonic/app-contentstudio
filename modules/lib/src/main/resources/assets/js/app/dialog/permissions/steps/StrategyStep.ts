import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {RadioButton} from '@enonic/lib-admin-ui/ui/RadioButton';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {ApplyPermissionsScope, ApplyPermissionsStrategy} from '../PermissionsData';
import {HelpTextContainer} from '@enonic/lib-admin-ui/form/HelpTextContainer';

export class StrategyStep
    extends DialogStep {

    private readonly container: Element;

    private readonly applyToRadioGroup: RadioGroup;
    private readonly itemAndChildrenRadioButton: RadioButton;
    private readonly childrenOnlyRadioButton: RadioButton;
    private readonly itemOnlyRadioButton: RadioButton;

    private readonly strategyRadioGroup: RadioGroup;
    private readonly strategyContainer: Element;

    constructor() {
        super();

        this.container = new SectionEl('strategy-step');

        this.applyToRadioGroup = new RadioGroup('apply-to-access-radio-group');
        this.itemOnlyRadioButton = this.applyToRadioGroup.addOption('single', `${i18n('dialog.permissions.step.apply.to.item')} (1)`);
        this.itemAndChildrenRadioButton = this.applyToRadioGroup.addOption('tree', i18n('dialog.permissions.step.apply.to.all'));
        this.childrenOnlyRadioButton = this.applyToRadioGroup.addOption('subtree', i18n('dialog.permissions.step.apply.to.children'));
        this.setupApplyToRadioGroup();

        this.strategyRadioGroup = new RadioGroup('strategy-radio-group');
        this.strategyContainer = new DivEl('strategy-step-container');
        this.strategyRadioGroup.addOption('merge', i18n('dialog.permissions.step.strategy.merge'));
        this.strategyRadioGroup.addOption('reset', i18n('dialog.permissions.step.strategy.overwrite'));
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

    getData(): { applyTo: ApplyPermissionsScope, strategy: ApplyPermissionsStrategy } {
        return {
            applyTo: this.applyToRadioGroup.getValue() as ApplyPermissionsScope,
            strategy: this.strategyRadioGroup.getValue() as ApplyPermissionsStrategy
        };
    }

    reset(): void {
        this.applyToRadioGroup.setValue('single', true);
        this.strategyRadioGroup.setValue('merge', true);
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

        this.strategyRadioGroup.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    private setupStrategyRadioGroup(): void {
        this.container.appendChild(this.strategyContainer);

        const labelAndHelpTextWrapper = new DivEl('strategy-label-and-help-text');
        const applyToLabel = new LabelEl(i18n('dialog.permissions.step.strategy.label'), this.strategyRadioGroup);
        labelAndHelpTextWrapper.appendChild(applyToLabel);

        const helpText = new HelpTextContainer(i18n('dialog.permissions.step.strategy.helptext'));
        labelAndHelpTextWrapper.appendChild(helpText.getToggler());

        this.strategyContainer.appendChildren(labelAndHelpTextWrapper, helpText.getHelpText(), this.strategyRadioGroup);
    }

    private updateStrategyRadioGroup(): void {
        const applyToValue = this.applyToRadioGroup.getValue() as ApplyPermissionsScope;
        this.strategyRadioGroup.setValue(applyToValue === 'single' ? 'reset' : 'merge', true);
        this.strategyContainer.setVisible(applyToValue !== 'single');
    }
}
