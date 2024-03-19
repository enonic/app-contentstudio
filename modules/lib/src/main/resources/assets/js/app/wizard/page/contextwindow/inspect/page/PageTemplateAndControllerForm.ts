import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PageTemplateAndControllerSelector} from './PageTemplateAndControllerSelector';
import {FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';

export class PageTemplateAndControllerForm
    extends Form {

    constructor(selector: PageTemplateAndControllerSelector) {
        super('page-template-and-controller-form');

        const fieldSet = new Fieldset();
        const wrapper = new PageDropdownWrapper(selector);
        fieldSet.add(new FormItemBuilder(wrapper).setLabel(i18n('field.page.template')).build());
        this.add(fieldSet);
    }
}

class PageDropdownWrapper
    extends FormInputEl {

    private readonly selector: PageTemplateAndControllerSelector;

    constructor(selector: PageTemplateAndControllerSelector) {
        super('div', 'content-selector-wrapper');

        this.selector = selector;
        this.appendChild(this.selector);
    }


    getValue(): string {
        return this.selector.getSelectedOption()?.getKey();
    }
}
