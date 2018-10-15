import {PageDescriptorCache} from '../page/PageDescriptorCache';
import PageDescriptorsJson = api.content.page.PageDescriptorsJson;
import PageDescriptor = api.content.page.PageDescriptor;
import PageDescriptorJson = api.content.page.PageDescriptorJson;

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

    fromJsonToPageDescriptor(json: api.content.page.PageDescriptorJson, ignoreCache: boolean = false): PageDescriptor {

        const pageDescriptor = api.content.page.PageDescriptor.fromJson(json);
        if (!ignoreCache) {
            this.cache.put(pageDescriptor);
        }

        return pageDescriptor;
    }

    fromJsonToPageDescriptors(json: PageDescriptorsJson): PageDescriptor[] {

        return json.descriptors.map((descriptorJson: PageDescriptorJson) => {
            return this.fromJsonToPageDescriptor(descriptorJson);
        });
    }
}
