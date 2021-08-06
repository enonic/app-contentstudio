import {LocaleListJson} from 'lib-admin-ui/locale/json/LocaleListJson';
import {LocaleJson} from 'lib-admin-ui/locale/json/LocaleJson';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Locale} from 'lib-admin-ui/locale/Locale';
import {CmsResourceRequest} from './CmsResourceRequest';

export class GetLocalesRequest
    extends CmsResourceRequest<Locale[]> {

    private searchQuery: string;

    constructor() {
        super();

        this.addRequestPathElements('content', 'locales');
    }

    getParams(): Object {
        return {
            query: this.searchQuery
        };
    }

    setSearchQuery(query: string): GetLocalesRequest {
        this.searchQuery = query;
        return this;
    }

    private sortFunction(a: Locale, b: Locale) {
        return a.getDisplayName().localeCompare(b.getDisplayName());
    }

    protected parseResponse(response: JsonResponse<LocaleListJson>): Locale[] {
        return response.getResult().locales.map((localeJson: LocaleJson) => {
            return Locale.fromJson(localeJson);
        }).sort(this.sortFunction);
    }
}
