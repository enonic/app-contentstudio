import type Q from 'q';
import {ProjectResourceRequest} from './ProjectResourceRequest';
import {type TaskInfo} from '@enonic/lib-admin-ui/task/TaskInfo';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsTaskableResourceRequest} from '../../resource/CmsTaskableResourceRequest';

export class SyncLayersRequest
    extends CmsTaskableResourceRequest<void> {

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

    protected handleTaskFailed(taskInfo: TaskInfo): void {
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
        this.failedHandler = handler;
        return this;
    }
}
