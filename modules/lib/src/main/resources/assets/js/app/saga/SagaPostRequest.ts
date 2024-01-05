import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export type SagaPostRequestConfig = SagaPostRequestParams;

interface SagaPostRequestParams {
    html: string;
    // TODO: Send selection range in the future
    selectedHtml: string;
}

export interface SagaPostRequestResult {
    assistant_id: string;
    thread_id: string;
    run_id: string;
    status: string;
}

export class SagaPostRequest
    extends ResourceRequest<SagaPostRequestResult> {

    private readonly config: SagaPostRequestConfig;

    constructor(config: SagaPostRequestConfig) {
        super();

        this.config = config;

        this.setMethod(HttpMethod.POST);
    }

    getRequestPath(): Path {
        return Path.fromString(CONFIG.getString('services.sagaServiceUrl'));
    }

    getParams(): SagaPostRequestParams {
        return {
            html: this.config.html,
            selectedHtml: this.config.selectedHtml,
        };
    }
}
