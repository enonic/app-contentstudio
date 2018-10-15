import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import LayoutDescriptorJson = api.content.page.region.LayoutDescriptorJson;
import {LayoutDescriptorCache} from '../page/region/LayoutDescriptorCache';

export class LayoutDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends api.rest.ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: api.rest.Path;

    cache: LayoutDescriptorCache;

    constructor() {
        super();
        this.cache = LayoutDescriptorCache.get();
        this.resourcePath = api.rest.Path.fromParent(super.getRestPath(), 'content', 'page', 'layout', 'descriptor');
    }

    getResourcePath(): api.rest.Path {
        return this.resourcePath;
    }

    fromJsonToLayoutDescriptor(json: LayoutDescriptorJson): LayoutDescriptor {

        let descriptor = LayoutDescriptor.fromJson(json);
        this.cache.put(descriptor);
        return descriptor;
    }
}
