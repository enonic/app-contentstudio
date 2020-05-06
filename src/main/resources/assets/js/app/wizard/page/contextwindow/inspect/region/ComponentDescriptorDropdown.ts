import {DescriptorBasedDropdown} from '../DescriptorBasedDropdown';
import {ComponentDescriptorLoader} from './ComponentDescriptorLoader';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';

export abstract class ComponentDescriptorDropdown<DESCRIPTOR extends Descriptor>
    extends DescriptorBasedDropdown<DESCRIPTOR> {

    protected loader: ComponentDescriptorLoader<DESCRIPTOR>;

    setApplicationKeys(applicationKeys: ApplicationKey[]) {
        this.loader.setApplicationKeys(applicationKeys);
    }
}
