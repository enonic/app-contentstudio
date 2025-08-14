import Q from 'q';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {StyleJson} from './StylesDescriptor';
import {Styles} from './Styles';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {ProjectContext} from '../../../../project/ProjectContext';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export interface GetStylesResponse {
    css: string[];
    styles: StyleJson[];
}

export class StylesRequest
    extends ResourceRequest<Styles> {

    private static requests: Record<string, Q.Promise<Styles>> = {};

    private contentId: string;

    constructor(contentId: string) {
        super();

        this.contentId = contentId;
    }

    static fetchStyles(contentId: string): Q.Promise<Styles> {

        const deferred = Q.defer<Styles>();

        if (Styles.getInstance(contentId)) {
            deferred.resolve(Styles.getInstance(contentId));

            return deferred.promise;
        }

        new StylesRequest(contentId).sendAndParse().then((styles: Styles) => deferred.resolve(styles));

        return deferred.promise;
    }

    getRequestPath(): Path {
        return Path.fromString(CONFIG.getString('services.stylesUrl'));
    }

    getParams(): object {
        return {
            contentId: this.contentId,
            project: ProjectContext.get().getProject().getName()
        };
    }

    sendAndParse(): Q.Promise<Styles> {
        if (StylesRequest.requests[this.contentId] != null) {
            // Avoid sending multiple requests for the same contentId,
            // for example when there are several HTML Area inputs on the same page
            return StylesRequest.requests[this.contentId];
        }

        if (Styles.getInstance(this.contentId)) {
            // If styles are already fetched for this contentId,
            // return them without sending a new request
            const deferred = Q.defer<Styles>();
            deferred.resolve(Styles.getInstance(this.contentId));

            return deferred.promise;
        }

        StylesRequest.requests[this.contentId] = this.send().then((response: JsonResponse<GetStylesResponse>) => {
            delete StylesRequest.requests[this.contentId];
            return this.fromJson(this.contentId, response.getResult());
        });

        return StylesRequest.requests[this.contentId];
    }

    private fromJson(contentId: string, json: GetStylesResponse): Styles {
        return new Styles(contentId, json);
    }
}
