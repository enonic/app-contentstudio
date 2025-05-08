import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {RadioButton} from '@enonic/lib-admin-ui/ui/RadioButton';
import {ApplyPermissionsScope} from '../PermissionsData';
import {HelpTextContainer} from '@enonic/lib-admin-ui/form/HelpTextContainer';

export class ApplyAccessToStep
    extends DialogStep {

    private readonly container: Element;
    private readonly applyToRadioGroup: RadioGroup;
    private readonly itemAndChildrenRadioButton: RadioButton;
    private readonly childrenOnlyRadioButton: RadioButton;
    private readonly itemOnlyRadioButton: RadioButton;

    constructor() {
        super();

        this.container = new SectionEl('apply-to-access-step');
        this.applyToRadioGroup = new RadioGroup('apply-to-access-radio-group');
        this.itemAndChildrenRadioButton = this.applyToRadioGroup.addOption('tree', i18n('dialog.permissions.step.apply.to.all'));
        this.childrenOnlyRadioButton = this.applyToRadioGroup.addOption('subtree', i18n('dialog.permissions.step.apply.to.children'));
        this.itemOnlyRadioButton = this.applyToRadioGroup.addOption('single', `${i18n('dialog.permissions.step.apply.to.item')} (1)`);
        this.setupApplyToRadioGroup();
    }

    getName(): string {
        return 'apply-access-to';
    }

    getHtmlEl(): Element {
        return this.container;
    }

    getDescription(): string {
        return i18n('dialog.permissions.step.apply.description');
    }

    setup(totalChildren: number): void {
        const hasChildren = totalChildren > 0;

        this.applyToRadioGroup.setValue(hasChildren ?  'tree' : 'single', true);
        this.itemAndChildrenRadioButton.setLabel(`${i18n('dialog.permissions.step.apply.to.all')} (${totalChildren + 1})`);
        this.childrenOnlyRadioButton.setLabel(
            i18n('dialog.permissions.step.apply.to.children') + (hasChildren ? ` (${totalChildren})` : ''));
        this.itemAndChildrenRadioButton.setEnabled(hasChildren);
        this.childrenOnlyRadioButton.setEnabled(hasChildren);

        const noChildrenTitle = i18n('dialog.permissions.step.apply.tooltip.nochildren');
        this.itemAndChildrenRadioButton.setTitle(hasChildren ? '' : noChildrenTitle);
        this.childrenOnlyRadioButton.setTitle(hasChildren ? '' : noChildrenTitle);
    }

    reset(): void {
        this.applyToRadioGroup.setValue('tree', true);
    }

    getData(): { applyTo: ApplyPermissionsScope } {
        return {
            applyTo: this.applyToRadioGroup.getValue() as ApplyPermissionsScope
        };
    }

    private setupApplyToRadioGroup(): void {
        const applyToContainer = new DivEl('apply-to-container');
        this.container.appendChild(applyToContainer);

        const labelAndHelpTextWrapper = new DivEl('apply-to-label-and-help-text');
        applyToContainer.appendChild(labelAndHelpTextWrapper);

        const applyToLabel = new LabelEl(i18n('dialog.permissions.step.apply.label'), this.applyToRadioGroup);
        labelAndHelpTextWrapper.appendChild(applyToLabel);

        const helpText = new HelpTextContainer(i18n('dialog.permissions.step.apply.helptext'));
        labelAndHelpTextWrapper.appendChild(helpText.getToggler());
        applyToContainer.appendChild(helpText.getHelpText());

        applyToContainer.appendChild(this.applyToRadioGroup);

        this.reset();

        this.applyToRadioGroup.onValueChanged(() => {
           this.notifyDataChanged();
        });
    }

}
