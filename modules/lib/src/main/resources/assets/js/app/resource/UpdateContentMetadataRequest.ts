import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {type Content} from '../content/Content';
import {type ContentJson} from '../content/ContentJson';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class UpdateContentMetadataRequest
    extends CmsContentResourceRequest<Content> {

    private id: string;

    private language: string;

    private owner: PrincipalKey;

    constructor(id: string) {
        super();
        this.id = id;
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('updateMetadata');
    }

    setLanguage(language: string): UpdateContentMetadataRequest {
        this.language = language;
        return this;
    }

    setOwner(owner: PrincipalKey): UpdateContentMetadataRequest {
        this.owner = owner;
        return this;
    }

    static create(content: Content): UpdateContentMetadataRequest {
        return new UpdateContentMetadataRequest(content.getId())
            .setOwner(content.getOwner())
            .setLanguage(content.getLanguage());
    }

    getParams(): object {
        return {
            contentId: this.id,
            language: this.language,
            owner: this.owner ? this.owner.toString() : undefined
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
