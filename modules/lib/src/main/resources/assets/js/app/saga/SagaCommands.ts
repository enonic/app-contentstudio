import * as Q from 'q';
import {SagaGetRequest, SagaGetRequestResult} from './SagaGetRequest';
import {SagaStartRequest, SagaStartRequestResult} from './SagaStartRequest';
import {SagaRunRequest, SagaRunRequestResult} from './SagaRunRequest';

export class SagaCommands {
    static expandText(message: string, chatId?: string): Q.Promise<string> {
        const chatIdPromise = chatId ? Q.resolve(chatId) : SagaCommands.sendStartRequest().then((startResult) => startResult.chatId);

        return chatIdPromise.then((chatId: string) => {
            return SagaCommands.sendRunRequest(chatId, message).then(() => chatId);
        });
    }

    private static sendStartRequest(): Q.Promise<SagaStartRequestResult> {
        return new SagaStartRequest().sendAndParse();
    }

    private static sendRunRequest(chatId: string, message: string): Q.Promise<SagaRunRequestResult> {
        return new SagaRunRequest({chatId, message}).sendAndParse();
    }

    private static sendRetrieveRequest(chatId: string): Q.Promise<SagaGetRequestResult> {
        return new SagaGetRequest(chatId).sendAndParse();
    }

    static waitForSagaToFinish(chatId: string,
                                       d?: Q.Deferred<SagaGetRequestResult>): Q.Promise<SagaGetRequestResult> {
        const defer = d ?? Q.defer<SagaGetRequestResult>();
        SagaCommands.sendRetrieveRequest(chatId)
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
                            SagaCommands.waitForSagaToFinish(chatId, defer);
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
