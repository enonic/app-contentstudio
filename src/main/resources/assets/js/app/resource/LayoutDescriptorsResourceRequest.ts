import LayoutDescriptorJson = api.content.page.region.LayoutDescriptorJson;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import LayoutDescriptorsJson = api.content.page.region.LayoutDescriptorsJson;
import {LayoutDescriptorResourceRequest} from './LayoutDescriptorResourceRequest';
import {LayoutDescriptorCache} from '../page/region/LayoutDescriptorCache';

export class LayoutDescriptorsResourceRequest
    extends LayoutDescriptorResourceRequest<LayoutDescriptorsJson, LayoutDescriptor[]> {

    cache: LayoutDescriptorCache;

    constructor() {
        super();
        this.cache = LayoutDescriptorCache.get();
    }

    fromJsonToLayoutDescriptors(json: LayoutDescriptorsJson): LayoutDescriptor[] {
        return json.descriptors.map((descriptorJson: LayoutDescriptorJson) => {
            let descriptor = LayoutDescriptor.fromJson(descriptorJson);
            this.cache.put(descriptor);
            return descriptor;
        });
    }
}
