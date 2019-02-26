import PartDescriptor = api.content.page.region.PartDescriptor;
import {PartDescriptorLoader} from './PartDescriptorLoader';
import {DescriptorViewer} from '../DescriptorViewer';
import {ComponentDescriptorDropdown} from './ComponentDescriptorDropdown';

export class PartDescriptorDropdown
    extends ComponentDescriptorDropdown<PartDescriptor> {

    constructor() {

        super({
            optionDisplayValueViewer: new DescriptorViewer<PartDescriptor>(),
            dataIdProperty: 'value',
            noOptionsText: 'No parts available'
        });
    }

    protected createLoader(): PartDescriptorLoader {
        return new PartDescriptorLoader();
    }
}
