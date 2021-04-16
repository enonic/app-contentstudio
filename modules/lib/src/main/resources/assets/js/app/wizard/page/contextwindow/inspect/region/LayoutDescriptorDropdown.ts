import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {LayoutDescriptorLoader} from './LayoutDescriptorLoader';
import {DescriptorViewer} from '../DescriptorViewer';
import {ComponentDescriptorsDropdown} from './ComponentDescriptorsDropdown';
/*
export class LayoutDescriptorDropdown
    extends ComponentDescriptorsDropdown<LayoutDescriptor> {

    constructor() {

        super({
            optionDisplayValueViewer: new DescriptorViewer<LayoutDescriptor>(),
            dataIdProperty: 'value',
            noOptionsText: 'No layouts available'
        });
    }

    protected createLoader(): LayoutDescriptorLoader {
        return new LayoutDescriptorLoader();
    }
}
*/
