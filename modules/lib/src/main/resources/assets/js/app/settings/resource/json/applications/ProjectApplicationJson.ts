import {type ApplicationJson} from '@enonic/lib-admin-ui/application/json/ApplicationJson';

export interface ProjectApplicationJson
    extends ApplicationJson {

    icon?: string;

    started?: boolean;
}
