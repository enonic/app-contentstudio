import {SagaPostRequest} from './SagaPostRequest';
import {Path} from '@enonic/lib-admin-ui/rest/Path';

export interface SagaRunRequestConfig {
    chatId: string;
    message: string;
}

interface SagaRunRequestBodyParams {
    message: string;
}

export interface SagaRunRequestResult {
    operation: string;
}

export class SagaRunRequest
    extends SagaPostRequest<SagaRunRequestResult> {

    private readonly config: SagaRunRequestConfig;

    constructor(config: SagaRunRequestConfig) {
        super();

        this.config = config;
    }

    getParams(): SagaRunRequestBodyParams {
        return {
            message: this.config.message,
        };
    }

    getRequestPath(): Path {
        return Path.create().setElements([super.getRequestPath().toString(), this.config.chatId]).build();
    }
}
