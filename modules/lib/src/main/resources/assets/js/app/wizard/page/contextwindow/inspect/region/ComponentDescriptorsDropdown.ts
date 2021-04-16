import {DescriptorBasedDropdown} from '../DescriptorBasedDropdown';
import {ComponentDescriptorsLoader} from './ComponentDescriptorsLoader';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ComponentType} from '../../../../../page/region/ComponentType';

export class ComponentDescriptorsDropdown
    extends DescriptorBasedDropdown {

    private componentType: ComponentType;

    protected loader: ComponentDescriptorsLoader;

    setComponentType(componentType: ComponentType) {
        this.componentType = componentType;
        return this;
    }

    setContentId(contentId: ContentId) {
        this.loader.setContentId(contentId);
    }

    protected createLoader(): ComponentDescriptorsLoader {
        return new ComponentDescriptorsLoader(this.componentType);
    }
}
