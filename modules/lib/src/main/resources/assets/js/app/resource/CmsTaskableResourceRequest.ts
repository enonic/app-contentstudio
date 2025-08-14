import {UrlHelper} from '../util/UrlHelper';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import Q from 'q';
import {TaskIdJson} from '@enonic/lib-admin-ui/task/TaskIdJson';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskEvent, TaskEventType} from '@enonic/lib-admin-ui/task/TaskEvent';
import {TaskInfo} from '@enonic/lib-admin-ui/task/TaskInfo';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {GetTaskInfoRequest} from './GetTaskInfoRequest';

export class CmsTaskableResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    private taskHandler: (event: TaskEvent) => void;

    private taskDeferred: Q.Deferred<PARSED_TYPE>;

    sendAndParse(): Q.Promise<PARSED_TYPE> {
        return this.send().then((response: JsonResponse<TaskIdJson>) => {
            const taskId: TaskId = TaskId.fromJson(response.getResult());
            return this.getTaskInfoPromise(taskId);
        });
    }

    getPostfixUri() {
        return UrlHelper.getCmsRestUri('');
    }

    private getTaskInfoPromise(taskId: TaskId): Q.Promise<PARSED_TYPE> {
        this.taskDeferred = Q.defer<PARSED_TYPE>();

        let taskEventsComing: boolean = false; // no events coming might mean that task is finished before we've got here

        this.taskHandler = (event: TaskEvent) => {
            if (!event.getTaskInfo().getId().equals(taskId)) {
                return;
            }

            if (event.getEventType() === TaskEventType.REMOVED) {
                TaskEvent.un(this.taskHandler);
                this.taskDeferred.resolve(this.handleTaskFinished(event.getTaskInfo()));
                return;
            }

            taskEventsComing = true;

            this.handleTaskEvent(event.getTaskInfo());
        };

        TaskEvent.on(this.taskHandler);

        new GetTaskInfoRequest(taskId).sendAndParse().then((taskInfo: TaskInfo) => {
            if (!taskEventsComing) {
                this.handleTaskEvent(taskInfo);
            }
        }).catch(DefaultErrorHandler.handle);

        return this.taskDeferred.promise;
    }

    private handleTaskEvent(taskInfo: TaskInfo) {
        if (taskInfo.getState() === TaskState.FINISHED) {
            TaskEvent.un(this.taskHandler);
            this.taskDeferred.resolve(this.handleTaskFinished(taskInfo));
        } else if (taskInfo.getState() === TaskState.FAILED) {
            TaskEvent.un(this.taskHandler);
            this.taskDeferred.reject(this.handleTaskFailed(taskInfo));
        }
    }

    protected handleTaskFinished(taskInfo: TaskInfo): Q.Promise<PARSED_TYPE> {
        return Q.resolve(null);
    }

    protected handleTaskFailed(taskInfo: TaskInfo): void {
        return;
    }
}
