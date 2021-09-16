import {Form, FormBuilder} from 'lib-admin-ui/form/Form';
import {FormJson} from 'lib-admin-ui/form/json/FormJson';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {FormItem} from 'lib-admin-ui/form/FormItem';
import {FormItemTypeWrapperJson} from 'lib-admin-ui/form/json/FormItemTypeWrapperJson';

export class DescriptorFormBuilder
    extends FormBuilder {

    private readonly applicationKey: ApplicationKey;

    constructor(applicationKey: ApplicationKey) {
        super();
        this.applicationKey = applicationKey;
    }

    protected createFormItem(formItemJson: FormItemTypeWrapperJson): FormItem {
        return super.createFormItem(formItemJson).setApplicationKey(this.applicationKey);
    }
}

export class DescriptorForm
    extends Form {

    static fromDescriptorJson(json: FormJson, applicationKey: ApplicationKey): Form {
        const builder: DescriptorFormBuilder = new DescriptorFormBuilder(applicationKey);
        builder.fromJson(json);
        return builder.build();
    }
}
