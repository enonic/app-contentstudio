import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {FragmentDropdown} from './FragmentDropdown';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';

export class FragmentSelectorForm
    extends Form {

    private fragmentSelector: FragmentDropdown;

    constructor(fragmentSelector: FragmentDropdown, title?: string) {
        super('fragment-dropdown-form');
        this.fragmentSelector = fragmentSelector;

        let fieldSet = new Fieldset();
        if (!StringHelper.isBlank(title)) {
            fieldSet.add(new FormItemBuilder(fragmentSelector).setLabel(title).build());
        } else {
            fieldSet.add(new FormItemBuilder(fragmentSelector).build());
        }

        this.add(fieldSet);
    }

    getSelector(): FragmentDropdown {
        return this.fragmentSelector;
    }

}
