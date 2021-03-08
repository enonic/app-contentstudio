import {ProjectListRequest} from './ProjectListRequest';
import {Project} from '../data/project/Project';
import * as Q from 'q';
import {ProjectsTreeBuilder} from './ProjectsTreeBuilder';

export class ProjectListWithMissingRequest extends ProjectListRequest {

    sendAndParse(): Q.Promise<Project[]> {
        return super.sendAndParse().then((projects: Project[]) => {
            return new ProjectsTreeBuilder(projects).build();
        });
    }

}
