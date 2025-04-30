import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {RadioButton} from '@enonic/lib-admin-ui/ui/RadioButton';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {ApplyPermissionsStrategy} from '../PermissionsData';

export class StrategyStep extends DialogStep {

    private readonly container: Element;
    private readonly strategyRadioGroup: RadioGroup;
    private readonly mergeRadioButton: RadioButton;
    private readonly resetRadioButton: RadioButton;

    constructor() {
        super();

        this.container = new SectionEl('strategy-step');
        this.strategyRadioGroup = new RadioGroup('strategy-radio-group');
        this.mergeRadioButton = this.strategyRadioGroup.addOption('merge', i18n('dialog.permissions.step.strategy.merge'));
        this.resetRadioButton = this.strategyRadioGroup.addOption('reset', i18n('dialog.permissions.step.strategy.reset'));
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
    }

    private setupStrategyRadioGroup(): void {
        const applyToContainer = new DivEl('strategy-step-container');
        this.container.appendChild(applyToContainer);
        applyToContainer.appendChild(this.strategyRadioGroup);

        const applyToLabel = new LabelEl(i18n('dialog.permissions.step.strategy.label'), this.strategyRadioGroup);
        applyToLabel.insertBeforeEl(this.strategyRadioGroup);

        this.reset();
    }
}
