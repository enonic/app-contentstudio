import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ImageContentComboBox} from '../../../../../inputtype/ui/selector/image/ImageContentComboBox';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {Fieldset} from 'lib-admin-ui/ui/form/Fieldset';
import {FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';

export class ImageSelectorForm
    extends Form {

    private imageSelector: ImageContentComboBox;

    constructor(templateSelector: ImageContentComboBox, title?: string) {
        super('image-combobox-form');
        this.imageSelector = templateSelector;

        let fieldSet = new Fieldset();
        if (!StringHelper.isBlank(title)) {
            fieldSet.add(new FormItemBuilder(templateSelector).setLabel(title).build());
        } else {
            fieldSet.add(new FormItemBuilder(templateSelector).build());
        }

        this.add(fieldSet);
    }

    getSelector(): ImageContentComboBox {
        return this.imageSelector;
    }

}
