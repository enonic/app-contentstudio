import * as Q from 'q';
import {SagaGetRequest, SagaGetRequestResult} from './SagaGetRequest';
import {SagaPostRequest, SagaPostRequestConfig, SagaPostRequestResult} from './SagaPostRequest';

export class SagaCommands {
    static expandText(message: string): Q.Promise<SagaPostRequestResult> {
        return SagaCommands.sendRunRequest(message);
    }

    private static sendRunRequest(message: string): Q.Promise<SagaPostRequestResult> {
        return new SagaPostRequest({message} satisfies SagaPostRequestConfig).sendAndParse();
    }

    private static sendRetrieveRequest(threadId: string, runId: string): Q.Promise<SagaGetRequestResult> {
        return new SagaGetRequest({threadId, runId}).sendAndParse();
    }

    static waitForSagaToFinish(threadId: string, runId: string,
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
