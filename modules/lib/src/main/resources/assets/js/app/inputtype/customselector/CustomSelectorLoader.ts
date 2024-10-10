import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PostLoader} from '@enonic/lib-admin-ui/util/loader/PostLoader';
import {CustomSelectorRequest} from './CustomSelectorRequest';
import {CustomSelectorItem} from './CustomSelectorItem';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';

export class CustomSelectorLoader
    extends PostLoader<CustomSelectorItem> {

    protected request: CustomSelectorRequest;

    private readonly debouncedRequest: (promise: Q.Deferred<CustomSelectorItem[]>) => void;

    constructor(requestPath?: string) {
        super();

        if (requestPath) {
            this.setRequestPath(requestPath);
        }

        this.debouncedRequest = AppHelper.debounce((promise: Q.Deferred<CustomSelectorItem[]>) => {
            const superPromise = super.sendRequest();
            superPromise.then((results: CustomSelectorItem[]) => {
                if (superPromise.isFulfilled() && this.getRequest().isFulfilled()) {
                    promise.resolve(results);
                }
                if (superPromise.isRejected()) {
                    promise.reject(results);
                }
            });
        }, 200);
    }

    search(searchString: string): Q.Promise<CustomSelectorItem[]> {
        this.setSearchString(searchString);
        return this.load();
    }

    load(postLoad: boolean = false): Q.Promise<CustomSelectorItem[]> {
        this.getRequest().setPostLoading(postLoad);

        return super.load(postLoad);
    }

    setRequestPath(requestPath: string) {
        this.getRequest().setRequestPath(requestPath);
    }

    protected createRequest(): CustomSelectorRequest {
        return new CustomSelectorRequest();
    }

    protected getRequest(): CustomSelectorRequest {
        return this.request;
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.getRequest().setQuery(value);
    }

    sendRequest(): Q.Promise<CustomSelectorItem[]> {
        if (!this.request.hasRequestPath()) {
            return Q.reject(i18n('field.customSelector.noService'));
        }
        const deferred: Q.Deferred<CustomSelectorItem[]> = Q.defer<CustomSelectorItem[]>();

        this.debouncedRequest(deferred);

        return deferred.promise;
    }

    sendPreLoadRequest(ids: string | string[]): Q.Promise<CustomSelectorItem[]> {
        if (!this.request.hasRequestPath()) {
            return Q.reject(i18n('field.customSelector.noService'));
        }

        const idsToLoad = Array.isArray(ids) ? ids : ids.split(';');

        return this.getRequest().setIds(idsToLoad).sendAndParse().then((results) => {
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
        return true;
    }
}
