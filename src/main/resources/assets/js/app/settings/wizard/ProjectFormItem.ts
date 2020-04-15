import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {HelpTextContainer} from 'lib-admin-ui/form/HelpTextContainer';

export class ProjectFormItem extends FormItem {

    private header: DivEl;

    private helpTextContainer?: HelpTextContainer;

    constructor(builder: ProjectFormItemBuilder) {
        super(builder);

        this.header = new DivEl('form-item-header');
        if (this.getLabel()) {
            this.header.appendChild(this.getLabel());
        }
        this.prependChild(this.header);

        if (builder.helpText) {
            this.helpTextContainer = new HelpTextContainer(builder.helpText);
            this.header.appendChild(this.helpTextContainer.getHelpText());
            this.helpTextContainer.toggleHelpText(true);
        }
    }

    disableHelpText() {
        if (this.helpTextContainer) {
            this.helpTextContainer.toggleHelpText();
        }
    }
}

export class ProjectFormItemBuilder extends FormItemBuilder {

    helpText: string;

    setHelpText(value: string): ProjectFormItemBuilder {
        this.helpText = value;

        return this;
    }

    build(): ProjectFormItem {
        return new ProjectFormItem(this);
    }
}
