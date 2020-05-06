import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {Form, FormBuilder} from 'lib-admin-ui/form/Form';
import {OccurrencesBuilder} from 'lib-admin-ui/form/Occurrences';
import {TextArea} from 'lib-admin-ui/form/inputtype/text/TextArea';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {ComponentName} from './ComponentName';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {ImageComponentJson} from './ImageComponentJson';
import {ImageComponentType} from './ImageComponentType';
import {ConfigBasedComponent, ConfigBasedComponentBuilder} from './ConfigBasedComponent';
import {Content} from '../../content/Content';
import {ImageHelper} from '../../util/ImageHelper';
import {InputBuilder} from 'lib-admin-ui/form/Input';

export class ImageComponent
    extends ConfigBasedComponent {

    public static PROPERTY_IMAGE: string = 'image';

    private image: ContentId;

    private form: Form;

    constructor(builder: ImageComponentBuilder) {
        super(builder);

        this.image = builder.image;
        this.form = this.createForm();
    }

    private createForm(): Form {
        const formBuilder = new FormBuilder();

        formBuilder.addFormItem(
            new InputBuilder().setName('caption').setInputType(TextArea.getName()).setLabel(i18n('field.caption')).setOccurrences(
                new OccurrencesBuilder().setMinimum(0).setMaximum(1).build()).build());

        return formBuilder.build();
    }

    getImage(): ContentId {
        return this.image;
    }

    getForm(): Form {
        return this.form;
    }

    setImage(imageContent: Content) {
        const oldValue = this.image;
        this.image = imageContent.getContentId();

        this.setName(new ComponentName(imageContent.getDisplayName()));
        this.updateConfigImageCaption(ImageHelper.getImageCaption(imageContent));

        if (!ObjectHelper.equals(oldValue, this.image)) {
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

        let json: ImageComponentJson = <ImageComponentJson>{};
        json.image = this.image != null ? this.image.toString() : null;
        json.config = this.config != null ? this.config.toJson() : null;

        return <ComponentTypeWrapperJson> {
            ImageComponent: json
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ImageComponent)) {
            return false;
        }

        const other = <ImageComponent>o;

        if (!ObjectHelper.equals(this.image, other.image)) {
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

    image: ContentId;

    constructor(source?: ImageComponent) {
        super(source);

        if (source) {
            this.image = source.getImage();
        }

        this.setType(ImageComponentType.get());
    }

    public setImage(value: ContentId): ImageComponentBuilder {
        this.image = value;
        return this;
    }

    public fromJson(json: ImageComponentJson): ImageComponentBuilder {
        super.fromJson(json);

        if (json.image) {
            this.setImage(new ContentId(json.image));
        }

        return this;
    }

    public build(): ImageComponent {
        return new ImageComponent(this);
    }
}
