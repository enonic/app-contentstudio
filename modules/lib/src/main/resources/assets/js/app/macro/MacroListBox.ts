import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {MacroViewer} from './MacroViewer';

export class MacroListBox extends ListBox<MacroDescriptor> {

    constructor() {
        super('macro-list-box');
    }

    protected createItemView(item: MacroDescriptor, readOnly: boolean): MacroViewer {
        const viewer = new MacroViewer();

        viewer.setObject(item);

        return viewer;
    }

    protected getItemId(item: MacroDescriptor): string {
        return item.getKey().getRefString();
    }

}
