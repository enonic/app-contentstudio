import PartDescriptorJson = api.content.page.region.PartDescriptorJson;
import PartDescriptor = api.content.page.region.PartDescriptor;
import PartDescriptorsJson = api.content.page.region.PartDescriptorsJson;
import {PartDescriptorResourceRequest} from './PartDescriptorResourceRequest';

export class PartDescriptorsResourceRequest
    extends PartDescriptorResourceRequest<PartDescriptorsJson, PartDescriptor[]> {

    fromJsonToPartDescriptors(json: PartDescriptorsJson): PartDescriptor[] {

        let array: PartDescriptor[] = [];
        json.descriptors.forEach((descriptorJson: PartDescriptorJson) => {
            array.push(this.fromJsonToPartDescriptor(descriptorJson));
        });
        return array;
    }
}
