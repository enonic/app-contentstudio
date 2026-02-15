import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type Descriptor} from '../../../../../page/Descriptor';
import {DescriptorViewer} from '../DescriptorViewer';

export class DescriptorListBox extends ListBox<Descriptor> {

    constructor() {
        super('common-page-list-box');
    }

    protected createItemView(item: Descriptor, readOnly: boolean): DescriptorViewer {
        const viewer = new DescriptorViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: Descriptor): string {
        return item.getKey().toString();
    }

}
