import * as Q from 'q';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {TaskIdJson} from 'lib-admin-ui/task/TaskIdJson';
import {TaskState} from 'lib-admin-ui/task/TaskState';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {TaskInfo} from 'lib-admin-ui/task/TaskInfo';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentPath} from '../content/ContentPath';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {GetTaskInfoRequest} from './GetTaskInfoRequest';

export class DeleteContentRequest
    extends CmsContentResourceRequest<TaskId> {

    private contentPaths: ContentPath[] = [];

    private deleteOnline: boolean;

    constructor(contentPath?: ContentPath) {
        super();
        this.setHeavyOperation(true);
        this.setMethod(HttpMethod.POST);
        if (contentPath) {
            this.addContentPath(contentPath);
        }
        this.addRequestPathElements('delete');
    }

    setContentPaths(contentPaths: ContentPath[]): DeleteContentRequest {
        this.contentPaths = contentPaths;
        return this;
    }

    addContentPath(contentPath: ContentPath): DeleteContentRequest {
        this.contentPaths.push(contentPath);
        return this;
    }

    setDeleteOnline(deleteOnline: boolean) {
        this.deleteOnline = deleteOnline;
    }

    getParams(): Object {
        let fn = (contentPath: ContentPath) => {
            return contentPath.toString();
        };
        return {
            contentPaths: this.contentPaths.map(fn),
            deleteOnline: this.deleteOnline
        };
    }

    protected parseResponse(response: JsonResponse<TaskIdJson>): TaskId {
        return TaskId.fromJson(response.getResult());
    }

    sendAndParseWithPolling(): Q.Promise<string> {
        return this.send().then((response: JsonResponse<TaskIdJson>) => {
            const deferred = Q.defer<string>();
            const taskId: TaskId = TaskId.fromJson(response.getResult());
            const poll = (interval: number = 500) => {
                setTimeout(() => {
                    new GetTaskInfoRequest(taskId).sendAndParse().then((task: TaskInfo) => {
                        let state = task.getState();
                        if (!task) {
                            deferred.reject('Task expired');
                            return; // task probably expired, stop polling
                        }

                        let progress = task.getProgress();

                        switch (state) {
                        case TaskState.FINISHED:
                            deferred.resolve(progress.getInfo());
                            break;
                        case TaskState.FAILED:
                            deferred.reject(progress.getInfo());
                            break;
                        default:
                            poll();
                        }
                    }).catch((reason: any) => {
                        DefaultErrorHandler.handle(reason);
                        deferred.reject(reason);
                    }).done();

                }, interval);
            };
            poll(0);

            return deferred.promise;
        });
    }
}
