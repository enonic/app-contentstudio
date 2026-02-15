import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {type FragmentDropdown} from './FragmentDropdown';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';

export class FragmentSelectorForm
    extends Form {

    constructor(fragmentSelector: FragmentDropdown, title?: string) {
        super('fragment-dropdown-form');

        const fieldSet = new Fieldset();
        const wrapper = new FragmentSelectorFormWrapper(fragmentSelector);
        const label = StringHelper.isBlank(title) ? null : title;

        fieldSet.add(new FormItemBuilder(wrapper).setLabel(label).build());

        this.add(fieldSet);
    }

}

class FragmentSelectorFormWrapper
    extends FormInputEl {

    private readonly selector: FragmentDropdown;

    constructor(selector: FragmentDropdown) {
        super('div', 'fragment-selector-wrapper');

        this.selector = selector;
        this.appendChild(this.selector);
    }


    getValue(): string {
        return this.selector.getSelectedFragment()?.getId() || '';
    }
}
