import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type Content} from '../content/Content';
import {type ContentJson} from '../content/ContentJson';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class UpdateContentLanguageRequest
    extends CmsContentResourceRequest<Content> {

    private id: string;

    private language: string;

    constructor(id: string) {
        super();
        this.id = id;
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('updateLanguage');
    }

    setLanguage(language: string): UpdateContentLanguageRequest {
        this.language = language;
        return this;
    }

    static create(content: Content): UpdateContentLanguageRequest {
        return new UpdateContentLanguageRequest(content.getId()).setLanguage(content.getLanguage());
    }

    getParams(): object {
        return {
            contentId: this.id,
            language: this.language,
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
