import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {MacroDescriptor} from 'lib-admin-ui/macro/MacroDescriptor';

export class MacroViewer
    extends NamesAndIconViewer<MacroDescriptor> {

    constructor() {
        super();
    }

    resolveDisplayName(object: MacroDescriptor): string {
        return object.getDisplayName();
    }

    resolveSubName(object: MacroDescriptor): string {
        return object.getDescription();
    }

    resolveIconUrl(object: MacroDescriptor): string {
        return object.getIconUrl();
    }
}
