import * as Q from 'q';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {GetLocalesRequest} from '../resource/GetLocalesRequest';

export class LocaleLoader
    extends BaseLoader<Locale> {

    protected request: GetLocalesRequest;
    private preservedSearchString: string;

    search(searchString: string): Q.Promise<Locale[]> {
        this.getRequest().setSearchQuery(searchString);

        return this.load();
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.getRequest().setSearchQuery(value);
    }

    load(): Q.Promise<Locale[]> {
        this.notifyLoadingData();

        return this.sendRequest()
            .then((locales: Locale[]) => {
                this.setResults(locales);
                this.notifyLoadedData(locales);

                if (this.preservedSearchString) {
                    this.search(this.preservedSearchString);
                    this.preservedSearchString = null;
                }
                return locales;
            });
    }

    protected createRequest(): GetLocalesRequest {
        return new GetLocalesRequest();
    }

    protected getRequest(): GetLocalesRequest {
        return this.request;
    }

}
