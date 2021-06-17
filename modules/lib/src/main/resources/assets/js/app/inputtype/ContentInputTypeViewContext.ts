import {InputTypeViewContext} from 'lib-admin-ui/form/inputtype/InputTypeViewContext';
import {ContentFormContext} from '../ContentFormContext';
import {Site} from '../content/Site';
import {ContentSummary} from '../content/ContentSummary';
import {ContentPath} from '../content/ContentPath';

export interface ContentInputTypeViewContext
    extends InputTypeViewContext {

    formContext: ContentFormContext;

    site: Site;

    content: ContentSummary;

    contentPath: ContentPath;

    parentContentPath: ContentPath;
}
