import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type ProjectReadAccess} from '../data/project/ProjectReadAccess';
import {ProjectResourceRequest} from './ProjectResourceRequest';
import {type TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type ProjectReadAccessJson} from './json/ProjectReadAccessJson';

export class UpdateProjectReadAccessRequest
    extends ProjectResourceRequest<TaskId> {

    private name: string;

    private readAccess: ProjectReadAccess;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('modifyReadAccess');
    }

    setName(value: string): UpdateProjectReadAccessRequest {
        this.name = value;
        return this;
    }

    setReadAccess(value: ProjectReadAccess): UpdateProjectReadAccessRequest {
        this.readAccess = value;
        return this;
    }

    getParams(): object {
        const params: {name: string, readAccess?: ProjectReadAccessJson} = {
            name: this.name
        };

        if (this.readAccess) {
            params.readAccess = this.readAccess.toJson();
        }

        return params;
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }
}
