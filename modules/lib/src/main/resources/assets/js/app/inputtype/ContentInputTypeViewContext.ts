import {InputTypeViewContext} from 'lib-admin-ui/form/inputtype/InputTypeViewContext';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
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
