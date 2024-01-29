import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {SagaRequest} from './SagaRequest';

export interface SagaPostRequestResult {
    assistantId: string;
    threadId: string;
    runId: string;
}

export class SagaPostRequest<T>
    extends SagaRequest<T> {

    constructor() {
        super();

        this.setMethod(HttpMethod.POST);
    }

}
