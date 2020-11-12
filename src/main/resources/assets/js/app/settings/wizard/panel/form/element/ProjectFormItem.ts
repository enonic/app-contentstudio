import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {HelpTextContainer} from 'lib-admin-ui/form/HelpTextContainer';

export class ProjectFormItem extends FormItem {

    private readonly helpTextContainer?: HelpTextContainer;

    constructor(builder: ProjectFormItemBuilder) {
        super(builder);

        if (this.getLabel()) {
            this.prependChild(this.getLabel());
        }

        if (builder.helpText) {
            this.helpTextContainer = new HelpTextContainer(builder.helpText);
            this.appendChild(this.helpTextContainer.getHelpText());
            this.helpTextContainer.toggleHelpText(true);
        }
    }

    disableHelpText() {
        if (this.helpTextContainer) {
            this.helpTextContainer.toggleHelpText(false);
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
