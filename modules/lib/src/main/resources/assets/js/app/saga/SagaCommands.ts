import * as Q from 'q';
import {SagaGetRequest, SagaGetRequestResult} from './SagaGetRequest';
import {SagaPostRequest, SagaPostRequestConfig, SagaPostRequestResult} from './SagaPostRequest';

export class SagaCommands {
    static expandText(html: string, selectedHtml?: string): Q.Promise<SagaGetRequestResult> {
        return SagaCommands.sendRunRequest(html, selectedHtml)
            .then((runResult: SagaPostRequestResult) => {
                //return SagaCommands.waitForSagaToFinish(runResult.thread_id, runResult.run_id);
                return runResult.data;
            })
            .catch((error) => {
                console.error(error);
                return {status: 'failed'};
            });
    }

    private static sendRunRequest(html: string, selectedHtml?: string): Q.Promise<SagaPostRequestResult> {
        return new SagaPostRequest({html, selectedHtml} satisfies SagaPostRequestConfig).sendAndParse();
    }

    private static sendRetrieveRequest(threadId: string, runId: string): Q.Promise<SagaGetRequestResult> {
        return new SagaGetRequest({threadId, runId}).sendAndParse();
    }

    private static waitForSagaToFinish(threadId: string, runId: string,
                                       d?: Q.Deferred<SagaGetRequestResult>): Q.Promise<SagaGetRequestResult> {
        const defer = d ?? Q.defer<SagaGetRequestResult>();
        SagaCommands.sendRetrieveRequest(threadId, runId)
            .then((retrieveResult) => {
                const status = retrieveResult.status;
                switch (status) {
                case 'completed':
                    defer.resolve(retrieveResult);
                    break;
                case 'failed':
                case 'expired':
                case 'cancelled':
                case 'cancelling':
                    defer.reject(retrieveResult);
                    break;
                case 'queued':
                case 'in_progress':
                    setTimeout(() => {
                        if (defer.promise.isPending()) {
                            SagaCommands.waitForSagaToFinish(threadId, runId, defer);
                        }
                    }, 3000);
                    break;
                default:
                    defer.reject({status: 'unknown'});
                    break;
                }
            })
            .catch((error) => {
                defer.reject(error);
            });

        return defer.promise;
    }
}
