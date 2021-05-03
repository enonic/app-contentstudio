import {InputTypeViewContext} from 'lib-admin-ui/form/inputtype/InputTypeViewContext';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentFormContext} from '../ContentFormContext';
import {Site} from '../content/Site';
import {ContentSummary} from '../content/ContentSummary';

export interface ContentInputTypeViewContext
    extends InputTypeViewContext {

    formContext: ContentFormContext;

    site: Site;

    content: ContentSummary;

    contentPath: ContentPath;

    parentContentPath: ContentPath;
}
