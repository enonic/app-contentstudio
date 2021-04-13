import {DescriptorBasedDropdown} from '../DescriptorBasedDropdown';
import {ComponentDescriptorLoader} from './ComponentDescriptorLoader';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {ContentId} from 'lib-admin-ui/content/ContentId';

export abstract class ComponentDescriptorDropdown<DESCRIPTOR extends Descriptor>
    extends DescriptorBasedDropdown<DESCRIPTOR> {

    protected loader: ComponentDescriptorLoader<DESCRIPTOR>;

    setContentId(contentId: ContentId) {
        this.loader.setContentId(contentId);
    }
}
