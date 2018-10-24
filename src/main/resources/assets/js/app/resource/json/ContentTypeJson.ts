import ContentTypeSummaryJson = api.schema.content.ContentTypeSummaryJson;
import FormJson = api.form.json.FormJson;

export interface ContentTypeJson
    extends ContentTypeSummaryJson {

    form: FormJson;
}
