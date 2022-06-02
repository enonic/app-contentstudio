import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PageTemplateAndControllerSelector} from './PageTemplateAndControllerSelector';
import {FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';

export class PageTemplateAndControllerForm
    extends Form {

    constructor(selector: PageTemplateAndControllerSelector) {
        super('page-template-and-controller-form');

        let fieldSet = new Fieldset();
        fieldSet.add(new FormItemBuilder(selector).setLabel(i18n('field.page.template')).build());
        this.add(fieldSet);
    }
}
