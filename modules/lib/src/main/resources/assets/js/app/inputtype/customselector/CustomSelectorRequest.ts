import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {CustomSelectorItem} from './CustomSelectorItem';
import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import type Q from 'q';

export interface CustomSelectorResponse {
    total: number;
    count: number;
    hits: CustomSelectorItem[];
}

export class CustomSelectorRequest
    extends ResourceRequest<CustomSelectorItem[]> {

    public static DEFAULT_SIZE: number = 10;

    private requestPath: string;
    private ids: string[] = [];
    private query: string;
    private start: number = 0;
    private nextStart: number;
    private count: number = CustomSelectorRequest.DEFAULT_SIZE;

    private results: CustomSelectorItem[];
    private loaded: boolean = false;
    private postLoading: boolean = false;
    private activeRequests: number = 0;

    setRequestPath(requestPath: string) {
        this.requestPath = requestPath;
    }

    hasRequestPath(): boolean {
        return !!this.requestPath;
    }

    isPartiallyLoaded(): boolean {
        return !!this.results && this.results.length > 0 && !this.loaded;
    }

    resetParams() {
        this.ids = [];
        this.start = 0;
        this.loaded = false;
    }

    getParams(): object {
        if (this.postLoading && this.start === 0) {
            // When CustomSelector switches to postLoading mode,
            // don't re-fetch the first batch but go directly to the second
            this.start = this.nextStart;
        }
        return {
            ids: this.ids && this.ids.length > 0 ? this.ids.toString() : null,
            query: this.query || null,
            start: this.start || null,
            count: this.count || null
        };
    }

    getRequestPath(): Path {
        return Path.create().fromString(this.requestPath).build();
    }

    private validateResponse(result: CustomSelectorResponse) {
        const errors = [];
        const isInvalid = (value) => value == null || value == null;

        if (isInvalid(result.total)) {
            errors.push('\'total\'');
        }
        if (isInvalid(result.count)) {
            errors.push('\'count\'');
        }
        if (isInvalid(result.hits)) {
            errors.push('\'hits\'');
        }
        if (errors.length > 0) {
            throw new Error(i18n('field.customSelector.errors', errors.join(', ')));
        }
    }

    setIds(ids: string[]): CustomSelectorRequest {
        this.ids = ids;
        return this;
    }

    setFrom(from: number): CustomSelectorRequest {
        this.start = from;
        return this;
    }

    setSize(size: number): CustomSelectorRequest {
        this.count = size;
        return this;
    }

    setQuery(query: string): CustomSelectorRequest {
        this.query = query;
        return this;
    }

    setPostLoading(value: boolean) {
        this.postLoading = value;
    }

    sendAndParse(): Q.Promise<CustomSelectorItem[]> {
        this.activeRequests++;
        return super.sendAndParse();
    }

    isFulfilled(): boolean {
        return this.activeRequests === 0;
    }

    protected parseResponse(response: JsonResponse<CustomSelectorResponse>): CustomSelectorItem[] {
        this.activeRequests--;
        const result: CustomSelectorResponse = response.getResult();
        if (this.start === 0) {
            this.results = [];
        }

        this.validateResponse(result);

        this.loaded = this.start + result.count >= result.total;

        if (this.postLoading) {
            this.start += result.count;
        } else if (this.start === 0) {
            // Save start of the second batch to avoid re-fetching the first batch for postLoad. Will be used in getParams().
            this.nextStart = result.count;
        }

        const items = result.hits.map((hit) => new CustomSelectorItem(hit));

        this.results = this.results.concat(items);

        return this.results;
    }
}
