import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ProjectsTreeItemJson, ProjectsTreeItemJsonContainer} from './json/ProjectsTreeItemJson';
import {ProjectsTreeItem} from '../data/project/ProjectsTreeItem';

export class ProjectsTreeRequest extends ProjectResourceRequest<ProjectsTreeItem[]> {

    private readonly name: string;

    constructor(name: string) {
        super();

        this.name = name;
        this.addRequestPathElements('getTree');
    }

    getParams(): object {
        return {
            name: this.name
        };
    }

    protected parseResponse(response: JsonResponse<ProjectsTreeItemJsonContainer>): ProjectsTreeItem[] {
        return response.getResult().entries.map(ProjectsTreeItem.fromJson);
    }
}
