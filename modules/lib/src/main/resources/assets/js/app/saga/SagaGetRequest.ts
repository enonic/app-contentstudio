import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {SagaRequest} from './SagaRequest';

export interface SagaGetRequestResult {
    status: string;
    messages?: string[];
}

export class SagaGetRequest
    extends SagaRequest<SagaGetRequestResult> {

    private readonly chatId: string;

    constructor(chatId: string) {
        super();

        this.chatId = chatId;

        this.setMethod(HttpMethod.GET);
    }

    getRequestPath(): Path {
        return Path.create().setElements([super.getRequestPath().toString(), this.chatId]).build();
    }
}
