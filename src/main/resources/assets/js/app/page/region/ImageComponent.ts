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
import {Content} from '../../content/Content';
import {ImageHelper} from '../../util/ImageHelper';

export class ImageComponent
    extends ConfigBasedComponent {

    public static PROPERTY_IMAGE: string = 'image';

    private image: api.content.ContentId;

    private form: Form;

    constructor(builder: ImageComponentBuilder) {
        super(builder);

        this.image = builder.image;
        this.form = this.createForm();
    }

    private createForm(): Form {
        const formBuilder = new FormBuilder();

        formBuilder.addFormItem(
            new api.form.InputBuilder().setName('caption').setInputType(TextArea.getName()).setLabel(i18n('field.caption')).setOccurrences(
                new OccurrencesBuilder().setMinimum(0).setMaximum(1).build()).build());

        return formBuilder.build();
    }

    getImage(): api.content.ContentId {
        return this.image;
    }

    getForm(): api.form.Form {
        return this.form;
    }

    setImage(imageContent: Content) {
        const oldValue = this.image;
        this.image = imageContent.getContentId();

        this.setName(new ComponentName(imageContent.getDisplayName()));
        this.updateConfigImageCaption(ImageHelper.getImageCaption(imageContent));

        if (!api.ObjectHelper.equals(oldValue, this.image)) {
            this.notifyPropertyChanged(ImageComponent.PROPERTY_IMAGE);
        }
    }

    private updateConfigImageCaption(caption: string) {
        this.config.setString('caption', 0, caption);
    }

    resetImage() {
        const hadImageBeforeReset: boolean = this.hasImage();
        this.image = null;

        this.setName(this.getType().getDefaultName());

        if (hadImageBeforeReset) {
            this.notifyPropertyChanged(ImageComponent.PROPERTY_IMAGE);
        }
    }

    hasImage(): boolean {
        return !!this.image;
    }

    doReset() {
        this.resetImage();
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
