import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ContentTypeSummary, ContentTypeSummaryBuilder} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {type ContentTypeJson} from '../../resource/json/ContentTypeJson';
import {Form} from '@enonic/lib-admin-ui/form/Form';

export class ContentType
    extends ContentTypeSummary
    implements Equitable {

    private form: Form;

    constructor(builder: ContentTypeBuilder) {
        super(builder);
        this.form = builder.form;
    }

    getForm(): Form {
        return this.form;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentType)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        const other = o as ContentType;

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

    form: Form;

    constructor(source?: ContentType) {
        super(source);
        if (source) {
            this.form = source.getForm();
        }
    }

    fromContentTypeJson(json: ContentTypeJson): ContentTypeBuilder {
        super.fromContentTypeSummaryJson(json);
        this.form = Form.fromJson(json.form);
        return this;
    }

    setForm(value: Form): ContentTypeSummaryBuilder {
        this.form = value;
        return this;
    }

    build(): ContentType {
        return new ContentType(this);
    }
}
