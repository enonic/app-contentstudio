import {InputTypeViewContext} from '@enonic/lib-admin-ui/form/inputtype/InputTypeViewContext';
import {ContentFormContext} from '../ContentFormContext';
import {Site} from '../content/Site';
import {ContentSummary} from '../content/ContentSummary';
import {Project} from '../settings/data/project/Project';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';

export interface ContentInputTypeViewContext
    extends InputTypeViewContext {

    formContext: ContentFormContext;

    site?: Site;

    content?: ContentSummary;

    project?: Project;

    applicationKey?: ApplicationKey;

}
