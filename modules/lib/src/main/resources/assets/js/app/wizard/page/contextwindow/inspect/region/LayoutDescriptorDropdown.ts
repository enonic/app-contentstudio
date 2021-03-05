import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {LayoutDescriptorLoader} from './LayoutDescriptorLoader';
import {DescriptorViewer} from '../DescriptorViewer';
import {ComponentDescriptorDropdown} from './ComponentDescriptorDropdown';

export class LayoutDescriptorDropdown
    extends ComponentDescriptorDropdown<LayoutDescriptor> {

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
