import {DescriptorBasedDropdown} from '../DescriptorBasedDropdown';
import {ComponentDescriptorsLoader} from './ComponentDescriptorsLoader';
import {ComponentType} from '../../../../../page/region/ComponentType';
import {ContentId} from '../../../../../content/ContentId';

export class ComponentDescriptorsDropdown
    extends DescriptorBasedDropdown {

    protected loader: ComponentDescriptorsLoader;

    setComponentType(componentType: ComponentType) {
        this.loader.setComponentType(componentType);
        return this;
    }

    setContentId(contentId: ContentId) {
        this.loader.setContentId(contentId);
    }

    protected createLoader(): ComponentDescriptorsLoader {
        return new ComponentDescriptorsLoader();
    }
}
