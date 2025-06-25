import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ContentTypeSummary, ContentTypeSummaryBuilder} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ContentTypeJson} from '../../resource/json/ContentTypeJson';
import {Form, FormBuilder} from '@enonic/lib-admin-ui/form/Form';
import {type Input, InputBuilder} from '@enonic/lib-admin-ui/form/Input';
import {TextLine} from '@enonic/lib-admin-ui/form/inputtype/text/TextLine';
import {OccurrencesBuilder} from '@enonic/lib-admin-ui/form/Occurrences';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

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

    private static readonly SITE_CONFIG_INPUT_PROP = 'siteConfig';

    private static readonly BASE_URL_INPUT_PROP = 'baseUrl';

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

        if (new ContentTypeName(json.name).isSite()) {
            this.form = ContentTypeBuilder.injectPortalBaseUrlFormItem(this.form);
        }

        return this;
    }

    setForm(value: Form): ContentTypeSummaryBuilder {
        this.form = value;
        return this;
    }

    build(): ContentType {
        return new ContentType(this);
    }

    private static injectPortalBaseUrlFormItem(form: Form): Form {
        const formItems = form.getFormItems();

        if (formItems.some((formItem) => formItem.getName() === ContentTypeBuilder.BASE_URL_INPUT_PROP)) {
            return form;
        }

        const siteConfigIndex = formItems.findIndex((formItem) => formItem.getName() === ContentTypeBuilder.SITE_CONFIG_INPUT_PROP);
        const insertAt = siteConfigIndex > -1 ? siteConfigIndex : 1;
        const patchedItems = [...formItems];

        patchedItems.splice(insertAt, 0, ContentTypeBuilder.createPortalBaseUrlFormItem());

        return new FormBuilder().addFormItems(patchedItems).build();
    }

    private static createPortalBaseUrlFormItem(): Input {
        return new InputBuilder().setName(ContentTypeBuilder.BASE_URL_INPUT_PROP).setInputType(TextLine.getName()).setLabel(
            i18n('field.baseUrl')).setHelpText(i18n('field.baseUrl.help')).setOccurrences(
            new OccurrencesBuilder().setMinimum(0).setMaximum(1).build()).build();
    }
}
