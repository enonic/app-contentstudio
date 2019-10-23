import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {Dropdown} from 'lib-admin-ui/ui/selector/dropdown/Dropdown';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {Fieldset} from 'lib-admin-ui/ui/form/Fieldset';
import {FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';

export class DescriptorBasedDropdownForm
    extends Form {

    private templateSelector: Dropdown<Descriptor>;

    constructor(templateSelector: Dropdown<Descriptor>, title?: string) {
        super('descriptor-based-dropdown-form');
        this.templateSelector = templateSelector;

        let fieldSet = new Fieldset();
        if (!StringHelper.isBlank(title)) {
            fieldSet.add(new FormItemBuilder(templateSelector).setLabel(title).build());
        } else {
            fieldSet.add(new FormItemBuilder(templateSelector).build());
        }

        this.add(fieldSet);
    }

    getSelector(): Dropdown<Descriptor> {
        return this.templateSelector;
    }

}
