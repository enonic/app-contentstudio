import {TaskInfo} from '@enonic/lib-admin-ui/task/TaskInfo';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {TaskInfoJson} from '@enonic/lib-admin-ui/task/TaskInfoJson';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskResourceRequest} from './TaskResourceRequest';


export class GetTaskInfoRequest
    extends TaskResourceRequest<TaskInfo> {

    constructor(taskId: TaskId) {
        super();
        this.addRequestPathElements(taskId.toString());
    }

    protected parseResponse(response: JsonResponse<TaskInfoJson>): TaskInfo {
        return TaskInfo.fromJson(response.getResult());
    }
}
