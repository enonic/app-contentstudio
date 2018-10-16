import {PageDescriptorCache} from '../page/PageDescriptorCache';

export class PageDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends api.rest.ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: api.rest.Path;

    cache: PageDescriptorCache;

    constructor() {
        super();
        this.cache = PageDescriptorCache.get();
        this.resourcePath = api.rest.Path.fromParent(super.getRestPath(), 'content', 'page', 'descriptor');
    }

    getResourcePath(): api.rest.Path {
        return this.resourcePath;
    }
}
