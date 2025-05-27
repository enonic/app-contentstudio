import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {RadioButton} from '@enonic/lib-admin-ui/ui/RadioButton';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {ApplyPermissionsScope} from '../PermissionsData';

export class StrategyStep
    extends DialogStep {

    private readonly container: Element;

    private readonly applyToRadioGroup: RadioGroup;
    private readonly itemAndChildrenRadioButton: RadioButton;
    private readonly childrenOnlyRadioButton: RadioButton;
    private readonly itemOnlyRadioButton: RadioButton;

    constructor() {
        super();

        this.container = new SectionEl('strategy-step');

        this.applyToRadioGroup = new RadioGroup('apply-to-access-radio-group');
        this.itemOnlyRadioButton = this.applyToRadioGroup.addOption('single', `${i18n('dialog.permissions.step.apply.to.item')} (1)`);
        this.itemAndChildrenRadioButton = this.applyToRadioGroup.addOption('tree', i18n('dialog.permissions.step.apply.to.all'));
        this.childrenOnlyRadioButton = this.applyToRadioGroup.addOption('subtree', i18n('dialog.permissions.step.apply.to.children'));
        this.setupApplyToRadioGroup();

        this.reset();
    }

    private setupApplyToRadioGroup(): void {
        const applyToContainer = new DivEl('apply-to-step-container');
        this.container.appendChild(applyToContainer);

        const applyToLabel = new LabelEl(i18n('dialog.permissions.step.apply.label'), this.applyToRadioGroup);
        applyToContainer.appendChild(applyToLabel);
        applyToContainer.appendChild(this.applyToRadioGroup);

        this.applyToRadioGroup.onValueChanged(() => {
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

    getData(): { applyTo: ApplyPermissionsScope } {
        return {
            applyTo: this.applyToRadioGroup.getValue() as ApplyPermissionsScope,
        };
    }

    reset(): void {
        this.applyToRadioGroup.setValue('single', true);
    }

    setTotalChildren(totalChildren: number): void {
        const hasChildren = totalChildren > 0;

        this.applyToRadioGroup.setValue('single', true);
        this.itemAndChildrenRadioButton.setLabel(`${i18n('dialog.permissions.step.apply.to.all')} (${totalChildren + 1})`);
        this.childrenOnlyRadioButton.setLabel(
            i18n('dialog.permissions.step.apply.to.children') + (hasChildren ? ` (${totalChildren})` : ''));
        this.itemAndChildrenRadioButton.setEnabled(hasChildren);
        this.childrenOnlyRadioButton.setEnabled(hasChildren);
    }
}
