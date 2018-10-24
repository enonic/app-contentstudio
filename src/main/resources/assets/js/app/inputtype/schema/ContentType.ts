import ContentTypeSummary = api.schema.content.ContentTypeSummary;
import ContentTypeSummaryBuilder = api.schema.content.ContentTypeSummaryBuilder;
import ObjectHelper = api.ObjectHelper;
import {ContentTypeJson} from '../../resource/json/ContentTypeJson';

export class ContentType
    extends ContentTypeSummary
    implements api.Equitable {

    private form: api.form.Form;

    constructor(builder: ContentTypeBuilder) {
        super(builder);
        this.form = builder.form;
    }

    getForm(): api.form.Form {
        return this.form;
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, ContentType)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = <ContentType>o;

        if (!ObjectHelper.equals(this.form, other.form)) {
            return false;
        }

        return true;
    }

    static fromJson(json: ContentTypeJson): ContentType {
        return new ContentTypeBuilder().fromContentTypeJson(json).build();
    }
}

export class ContentTypeBuilder
    extends ContentTypeSummaryBuilder {

    form: api.form.Form;

    constructor(source?: ContentType) {
        if (source) {
            super(source);
            this.form = source.getForm();
        }
    }

    fromContentTypeJson(json: ContentTypeJson): ContentTypeBuilder {
        super.fromContentTypeSummaryJson(json);
        this.form = api.form.FormItemFactory.createForm(json.form);
        return this;
    }

    setForm(value: api.form.Form): ContentTypeSummaryBuilder {
        this.form = value;
        return this;
    }

    build(): ContentType {
        return new ContentType(this);
    }
}
