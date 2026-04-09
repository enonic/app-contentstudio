import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {type ComponentDescriptorsDropdown} from './ComponentDescriptorsDropdown';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {isBlank} from '../../../../../../v6/features/utils/format/isBlank';

export class DescriptorBasedDropdownForm
    extends Form {

    private templateSelector: ComponentDescriptorsDropdown;

    constructor(templateSelector: ComponentDescriptorsDropdown, title?: string) {
        super('descriptor-based-dropdown-form');
        this.templateSelector = templateSelector;
        const wrapper = new ComponentDescriptorsDropdownWrapper(templateSelector);

        const fieldSet = new Fieldset();
        const label = isBlank(title) ? null : title;
        fieldSet.add(new FormItemBuilder(wrapper).setLabel(label).build());

        this.add(fieldSet);
    }

}

class ComponentDescriptorsDropdownWrapper
    extends FormInputEl {

    private readonly selector: ComponentDescriptorsDropdown;

    constructor(selector: ComponentDescriptorsDropdown) {
        super('div', 'content-selector-wrapper');

        this.selector = selector;
        this.appendChild(this.selector);
    }


    getValue(): string {
        return this.selector.getSelectedDescriptor()?.getKey().toString() || '';
    }
}
