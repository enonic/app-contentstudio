import {type InputTypeViewContext} from '@enonic/lib-admin-ui/form/inputtype/InputTypeViewContext';
import {type ContentFormContext} from '../ContentFormContext';
import {type Site} from '../content/Site';
import {type ContentSummary} from '../content/ContentSummary';
import {type Project} from '../settings/data/project/Project';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';

export interface ContentInputTypeViewContext
    extends InputTypeViewContext {

    formContext: ContentFormContext;

    site?: Site;

    content?: ContentSummary;

    project?: Project;

    applicationKey?: ApplicationKey;

}
