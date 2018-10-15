import LayoutDescriptorJson = api.content.page.region.LayoutDescriptorJson;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import LayoutDescriptorsJson = api.content.page.region.LayoutDescriptorsJson;
import {LayoutDescriptorResourceRequest} from './LayoutDescriptorResourceRequest';

export class LayoutDescriptorsResourceRequest
    extends LayoutDescriptorResourceRequest<LayoutDescriptorsJson, LayoutDescriptor[]> {

    fromJsonToLayoutDescriptors(json: LayoutDescriptorsJson): LayoutDescriptor[] {

        let array: LayoutDescriptor[] = [];
        json.descriptors.forEach((descriptorJson: LayoutDescriptorJson) => {
            array.push(this.fromJsonToLayoutDescriptor(descriptorJson));
        });
        return array;
    }

}
