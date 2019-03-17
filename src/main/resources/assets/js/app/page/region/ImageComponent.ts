import Form = api.form.Form;
import FormBuilder = api.form.FormBuilder;
import OccurrencesBuilder = api.form.OccurrencesBuilder;
import TextArea = api.form.inputtype.text.TextArea;
import PropertyTree = api.data.PropertyTree;
import i18n = api.util.i18n;
import {ComponentName} from './ComponentName';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {ImageComponentJson} from './ImageComponentJson';
import {ImageComponentType} from './ImageComponentType';
import {ConfigBasedComponent, ConfigBasedComponentBuilder} from './ConfigBasedComponent';

export class ImageComponent
    extends ConfigBasedComponent {

    public static PROPERTY_IMAGE: string = 'image';

    private image: api.content.ContentId;

    private form: Form;

    constructor(builder: ImageComponentBuilder) {
        super(builder);

        this.image = builder.image;

        let formBuilder = new FormBuilder();
        formBuilder.addFormItem(
            new api.form.InputBuilder().setName('caption').setInputType(TextArea.getName()).setLabel(i18n('field.caption')).setOccurrences(
                new OccurrencesBuilder().setMinimum(0).setMaximum(1).build()).build());
        this.form = formBuilder.build();
    }

    getImage(): api.content.ContentId {
        return this.image;
    }

    getForm(): api.form.Form {
        return this.form;
    }

    setImage(contentId: api.content.ContentId, name: string) {
        let oldValue = this.image;
        this.image = contentId;

        this.setName(name ? new ComponentName(name) : this.getType().getDefaultName());

        if (!api.ObjectHelper.equals(oldValue, contentId)) {
            this.notifyPropertyChanged(ImageComponent.PROPERTY_IMAGE);
        }
    }

    hasImage(): boolean {
        return !!this.image;
    }

    doReset() {
        this.setImage(null, null);
        this.config = new PropertyTree();
    }

    isEmpty(): boolean {
        return !this.image;
    }

    toJson(): ComponentTypeWrapperJson {

        let json: ImageComponentJson = <ImageComponentJson>super.toComponentJson();
        json.image = this.image != null ? this.image.toString() : null;
        json.config = this.config != null ? this.config.toJson() : null;

        return <ComponentTypeWrapperJson> {
            ImageComponent: json
        };
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, ImageComponent)) {
            return false;
        }

        const other = <ImageComponent>o;

        if (!api.ObjectHelper.equals(this.image, other.image)) {
            return false;
        }

        return super.equals(o);
    }

    clone(): ImageComponent {
        return new ImageComponentBuilder(this).build();
    }
}

export class ImageComponentBuilder
    extends ConfigBasedComponentBuilder<ImageComponent> {

    image: api.content.ContentId;

    constructor(source?: ImageComponent) {
        super(source);

        if (source) {
            this.image = source.getImage();
        }

        this.setType(ImageComponentType.get());
    }

    public setImage(value: api.content.ContentId): ImageComponentBuilder {
        this.image = value;
        return this;
    }

    public fromJson(json: ImageComponentJson): ImageComponentBuilder {
        super.fromJson(json);

        if (json.image) {
            this.setImage(new api.content.ContentId(json.image));
        }

        return this;
    }

    public build(): ImageComponent {
        return new ImageComponent(this);
    }
}
