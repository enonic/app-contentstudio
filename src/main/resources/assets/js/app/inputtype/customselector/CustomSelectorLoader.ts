import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {PostLoader} from 'lib-admin-ui/util/loader/PostLoader';
import {CustomSelectorRequest, CustomSelectorResponse} from './CustomSelectorRequest';
import {CustomSelectorItem} from './CustomSelectorItem';

export class CustomSelectorLoader
    extends PostLoader<CustomSelectorResponse, CustomSelectorItem> {

    protected request: CustomSelectorRequest;

    constructor(requestPath: string) {
        super();

        if (requestPath) {
            this.getRequest().setRequestPath(requestPath);
        }
    }

    protected createRequest(): CustomSelectorRequest {
        return new CustomSelectorRequest();
    }

    protected getRequest(): CustomSelectorRequest {
        return this.request;
    }

    search(searchString: string): Q.Promise<CustomSelectorItem[]> {

        this.getRequest().setQuery(searchString);
        return this.load();
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.getRequest().setQuery(value);
    }

    sendRequest(): Q.Promise<CustomSelectorItem[]> {
        if (!this.request.hasRequestPath()) {
            return Q.reject(i18n('field.customSelector.noService'));
        }
        return super.sendRequest();
    }

    protected sendPreLoadRequest(ids: string): Q.Promise<CustomSelectorItem[]> {
        if (!this.request.hasRequestPath()) {
            return Q.reject(i18n('field.customSelector.noService'));
        }
        return this.getRequest().setIds(ids.split(';')).sendAndParse().then((results) => {
            this.getRequest().setIds([]);
            return results;
        });
    }

    resetParams() {
        return this.getRequest().resetParams();
    }

    isPartiallyLoaded(): boolean {
        return this.getRequest().isPartiallyLoaded();
    }

    filterFn(item: CustomSelectorItem): boolean {
        return item.displayName.indexOf(this.getSearchString().toLowerCase()) !== -1;
    }
}
