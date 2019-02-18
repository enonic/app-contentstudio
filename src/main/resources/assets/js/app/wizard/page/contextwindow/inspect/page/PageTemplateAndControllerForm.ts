import {PageTemplateAndControllerSelector} from './PageTemplateAndControllerSelector';
import FormItemBuilder = api.ui.form.FormItemBuilder;
import Fieldset = api.ui.form.Fieldset;
import i18n = api.util.i18n;

export class PageTemplateAndControllerForm
    extends api.ui.form.Form {

    constructor(selector: PageTemplateAndControllerSelector) {
        super('page-template-and-controller-form');

        let fieldSet = new Fieldset();
        fieldSet.add(new FormItemBuilder(selector).setLabel(i18n('field.page.template')).build());
        this.add(fieldSet);
    }
}
