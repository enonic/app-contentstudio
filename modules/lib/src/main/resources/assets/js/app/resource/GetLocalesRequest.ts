import {type LocaleListJson} from '@enonic/lib-admin-ui/locale/json/LocaleListJson';
import {type LocaleJson} from '@enonic/lib-admin-ui/locale/json/LocaleJson';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {CmsResourceRequest} from './CmsResourceRequest';
import {ContentResourceRequest} from './ContentResourceRequest';
import {LocaleComparatorByQuery} from '../locale/LocaleComparatorByQuery';

export class GetLocalesRequest
    extends CmsResourceRequest<Locale[]> {

    private searchQuery: string;

    constructor() {
        super();

        this.addRequestPathElements(ContentResourceRequest.CONTENT_PATH, 'locales');
    }

    getParams(): object {
        return {
            query: this.searchQuery
        };
    }

    setSearchQuery(query: string): GetLocalesRequest {
        this.searchQuery = query;
        return this;
    }

    protected parseResponse(response: JsonResponse<LocaleListJson>): Locale[] {
        const result = response.getResult().locales.map((localeJson: LocaleJson) => {
            return Locale.fromJson(localeJson);
        });

        if (this.searchQuery) {
            return result.sort(this.sortByQuery.bind(this));
        }

        return result.sort(this.sortByDisplayName);
    }

    private sortByDisplayName(a: Locale, b: Locale) {
        return a.getDisplayName().localeCompare(b.getDisplayName());
    }

    private sortByQuery(a: Locale, b: Locale): number {
        return new LocaleComparatorByQuery(a, b, this.searchQuery).compare();
    }

}
