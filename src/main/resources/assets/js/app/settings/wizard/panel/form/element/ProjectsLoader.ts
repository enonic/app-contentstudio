import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';
import {Project} from '../../../../data/project/Project';
import {ProjectListRequest} from '../../../../resource/ProjectListRequest';

export class ProjectsLoader extends BaseLoader<Project> {

    protected createRequest(): ProjectListRequest {
        return new ProjectListRequest();
    }

}
