import InputTypeViewContext = api.form.inputtype.InputTypeViewContext;
import ContentSummary = api.content.ContentSummary;
import ContentPath = api.content.ContentPath;
import {ContentFormContext} from '../ContentFormContext';
import {Site} from '../content/Site';

export interface ContentInputTypeViewContext
    extends InputTypeViewContext {

    formContext: ContentFormContext;

    site: Site;

    content: ContentSummary;

    contentPath: ContentPath;

    parentContentPath: ContentPath;
}
