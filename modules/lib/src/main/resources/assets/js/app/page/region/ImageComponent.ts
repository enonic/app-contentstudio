import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type Form, FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {OccurrencesBuilder} from '@enonic/lib-admin-ui/form/Occurrences';
import {TextArea} from '@enonic/lib-admin-ui/form/inputtype/text/TextArea';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ComponentName} from './ComponentName';
import {type ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {type ImageComponentJson} from './ImageComponentJson';
import {ImageComponentType} from './ImageComponentType';
import {ConfigBasedComponent, ConfigBasedComponentBuilder} from './ConfigBasedComponent';
import {type Content} from '../../content/Content';
import {ImageHelper} from '../../util/ImageHelper';
import {InputBuilder} from '@enonic/lib-admin-ui/form/Input';
import {ContentId} from '../../content/ContentId';
import {ComponentImageUpdatedEvent} from './ComponentImageUpdatedEvent';

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
            this.notifyComponentUpdated(new ComponentImageUpdatedEvent(this.getPath(), this.image));
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
            this.notifyComponentUpdated(new ComponentImageUpdatedEvent(this.getPath(), this.image));
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

        const json: ImageComponentJson = {} as ImageComponentJson;
        json.image = this.image != null ? this.image.toString() : null;
        json.config = this.config != null ? this.config.toJson() : null;

        return {
            ImageComponent: json
        } as ComponentTypeWrapperJson;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ImageComponent)) {
            return false;
        }

        const other = o as ImageComponent;

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
    extends ConfigBasedComponentBuilder {

    image: ContentId;

    constructor(source?: ImageComponent) {
        super(source);

        if (source) {
            this.image = source.getImage();
        }

        this.setType(ImageComponentType.get());
    }

    public setImage(value: ContentId): this {
        this.image = value;
        return this;
    }

    public fromJson(json: ImageComponentJson): this {
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
