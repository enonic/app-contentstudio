import ApplicationKey = api.application.ApplicationKey;
import PartDescriptor = api.content.page.region.PartDescriptor;
import {DescriptorBasedDropdown} from '../DescriptorBasedDropdown';
import {PartDescriptorLoader} from './PartDescriptorLoader';
import {DescriptorViewer} from '../DescriptorViewer';

export class PartDescriptorDropdown
    extends DescriptorBasedDropdown<PartDescriptor> {

    protected loader: PartDescriptorLoader;

    constructor() {

        super({
            optionDisplayValueViewer: new DescriptorViewer<PartDescriptor>(),
            dataIdProperty: 'value',
            noOptionsText: 'No parts available'
        });
    }

    loadDescriptors(applicationKeys: ApplicationKey[]) {
        this.loader.setApplicationKeys(applicationKeys);

        super.load();
    }

    protected createLoader(): PartDescriptorLoader {
        return new PartDescriptorLoader();
    }
}
