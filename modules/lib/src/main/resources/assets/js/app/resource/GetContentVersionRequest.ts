import type Q from 'q';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type Content} from '../content/Content';
import {type ContentJson} from '../content/ContentJson';
import {RepositoryId} from '../repository/RepositoryId';
import {type ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export class GetContentVersionRequest
    extends CmsContentResourceRequest<Content> {

    readonly id: ContentId;

    private versionId: string;

    constructor(id: ContentId) {
        super();
        this.id = id;
    }

    public setVersion(version: string): GetContentVersionRequest {
        this.versionId = version;
        return this;
    }

    getParams(): object {
        return {
            contentId: this.id.toString(),
            versionId: this.versionId,
            repositoryId: RepositoryId.fromCurrentProject().toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromString(CONFIG.getString('services.contentUrl'));
    }

    sendRequest(): Q.Promise<ContentJson> {

        return this.send().then((response: JsonResponse<ContentJson>) => {
            return response.getResult();
        });
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
