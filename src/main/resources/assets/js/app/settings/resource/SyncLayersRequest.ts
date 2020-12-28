import * as Q from 'q';
import {TaskResourceRequest} from 'lib-admin-ui/rest/TaskResourceRequest';
import {ProjectResourceRequest} from './ProjectResourceRequest';
import {TaskInfo} from 'lib-admin-ui/task/TaskInfo';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class SyncLayersRequest extends TaskResourceRequest<void> {

    private finishedHandler: () => void;

    private failedHandler: () => void;

    constructor() {
        super();

        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements(ProjectResourceRequest.PROJECT_RESOURCE_PATH, 'syncAll');
    }

    protected handleTaskFinished(taskInfo: TaskInfo): Q.Promise<void> {
        if (this.finishedHandler) {
            this.finishedHandler();
        }
        return super.handleTaskFinished(taskInfo);
    }

    protected handleTaskFailed(taskInfo: TaskInfo): any {
        if (this.failedHandler) {
            this.failedHandler();
        }
        return super.handleTaskFailed(taskInfo);
    }

    setFinishedHandler(handler: () => void): SyncLayersRequest {
        this.finishedHandler = handler;
        return this;
    }

    setFailedHandler(handler: () => void): SyncLayersRequest {
        this.finishedHandler = handler;
        return this;
    }
}
