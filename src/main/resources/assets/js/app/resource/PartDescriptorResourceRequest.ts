import PartDescriptor = api.content.page.region.PartDescriptor;
import PartDescriptorJson = api.content.page.region.PartDescriptorJson;
import {PartDescriptorCache} from '../page/region/PartDescriptorCache';

export class PartDescriptorResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends api.rest.ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: api.rest.Path;

    cache: PartDescriptorCache;

    constructor() {
        super();
        this.cache = PartDescriptorCache.get();
        this.resourcePath = api.rest.Path.fromParent(super.getRestPath(), 'content', 'page', 'part', 'descriptor');
    }

    getResourcePath(): api.rest.Path {
        return this.resourcePath;
    }

    fromJsonToPartDescriptor(json: PartDescriptorJson): PartDescriptor {
        let partDescriptor = PartDescriptor.fromJson(json);
        this.cache.put(partDescriptor);
        return partDescriptor;
    }
}
