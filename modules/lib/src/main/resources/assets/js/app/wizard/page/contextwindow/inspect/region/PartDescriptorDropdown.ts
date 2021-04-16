import {PartDescriptor} from 'lib-admin-ui/content/page/region/PartDescriptor';
import {PartDescriptorLoader} from './PartDescriptorLoader';
import {DescriptorViewer} from '../DescriptorViewer';
import {ComponentDescriptorsDropdown} from './ComponentDescriptorsDropdown';
import {ComponentDescriptorsLoader} from './ComponentDescriptorsLoader';
/*
export class PartDescriptorDropdown
    extends ComponentDescriptorsDropdown {

    constructor() {

        super({
            optionDisplayValueViewer: new DescriptorViewer<PartDescriptor>(),
            dataIdProperty: 'value',
            noOptionsText: 'No parts available'
        });
    }

    protected createLoader(): ComponentDescriptorsLoader {
        return new PartDescriptorLoader();
    }
}
*/
