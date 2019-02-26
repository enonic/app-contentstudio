import {DescriptorBasedDropdown} from '../DescriptorBasedDropdown';
import {ComponentDescriptorLoader} from './ComponentDescriptorLoader';
import Descriptor = api.content.page.Descriptor;
import ApplicationKey = api.application.ApplicationKey;

export abstract class ComponentDescriptorDropdown<DESCRIPTOR extends Descriptor>
    extends DescriptorBasedDropdown<DESCRIPTOR> {

    protected loader: ComponentDescriptorLoader<any, DESCRIPTOR>;

    loadDescriptors(applicationKeys: ApplicationKey[]) {
        this.loader.setApplicationKeys(applicationKeys);

        super.load();
    }
}
