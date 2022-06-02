import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ProjectsTreeItemJson} from './json/ProjectsTreeItemJson';
import {ProjectsTreeItem} from '../data/project/ProjectsTreeItem';

export class ProjectsTreeRequest extends ProjectResourceRequest<ProjectsTreeItem[]> {

    private readonly name: string;

    constructor(name: string) {
        super();

        this.name = name;
        this.addRequestPathElements('getTree');
    }

    getParams(): Object {
        return {
            name: this.name
        };
    }

    protected parseResponse(response: JsonResponse<ProjectsTreeItemJson[]>): ProjectsTreeItem[] {
        return (<any>response.getResult())['entries'].map(ProjectsTreeItem.fromJson);
    }

}
