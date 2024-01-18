import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export type SagaGetRequestConfig = SagaGetRequestParams;

interface SagaGetRequestParams {
    threadId: string;
    runId: string;
}

export interface SagaGetRequestResult {
    status: string;
    messages?: string[];
}

export class SagaGetRequest
    extends ResourceRequest<SagaGetRequestResult> {

    private readonly config: SagaGetRequestConfig;

    constructor(config: SagaGetRequestConfig) {
        super();

        this.config = config;

        this.setMethod(HttpMethod.GET);
    }

    getRequestPath(): Path {
        return Path.fromString(
            `${CONFIG.getString('services.sagaServiceUrl')}?threadId=${this.config.threadId}&runId=${this.config.runId}`);
    }
}
