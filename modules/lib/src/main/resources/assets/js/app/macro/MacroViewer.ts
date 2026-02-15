import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {type MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';

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
