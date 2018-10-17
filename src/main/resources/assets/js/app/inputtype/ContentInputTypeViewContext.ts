import InputTypeViewContext = api.form.inputtype.InputTypeViewContext;
import ContentSummary = api.content.ContentSummary;
import ContentPath = api.content.ContentPath;
import Site = api.content.site.Site;
import {ContentFormContext} from '../ContentFormContext';

export interface ContentInputTypeViewContext
    extends InputTypeViewContext {

    formContext: ContentFormContext;

    site: Site;

    content: ContentSummary;

    contentPath: ContentPath;

    parentContentPath: ContentPath;
}
