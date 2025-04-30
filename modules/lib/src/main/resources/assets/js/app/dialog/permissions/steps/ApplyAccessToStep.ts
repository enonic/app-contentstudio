import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {RadioButton} from '@enonic/lib-admin-ui/ui/RadioButton';
import {ApplyPermissionsScope} from '../PermissionsData';

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

    setup(total: number): void {
        this.applyToRadioGroup.setValue('tree', true);

        this.itemAndChildrenRadioButton.setLabel(`${i18n('dialog.permissions.step.apply.to.all')} (${total})`);
        this.childrenOnlyRadioButton.setLabel(`${i18n('dialog.permissions.step.apply.to.children')} (${total - 1})`);

        this.childrenOnlyRadioButton.setEnabled(total > 1);
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
        applyToContainer.appendChild(this.applyToRadioGroup);

        const applyToLabel = new LabelEl(i18n('dialog.permissions.step.apply.label'), this.applyToRadioGroup);
        applyToLabel.insertBeforeEl(this.applyToRadioGroup);

        this.reset();
    }

}
