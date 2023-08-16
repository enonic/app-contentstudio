import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {ComponentsTreeItem} from './ComponentsTreeItem';

export class PageComponentsItemViewer
    extends NamesAndIconViewer<ComponentsTreeItem> {

    constructor() {
        super('page-components-item-viewer');
    }

    resolveDisplayName(item: ComponentsTreeItem): string {
        return item.getComponent().getDisplayName();
    }

    resolveSubName(item: ComponentsTreeItem): string {
        return item.getComponent().getDescription();
    }

    resolveIconUrl(item: ComponentsTreeItem): string {
        return item.getComponent().getIconUrl();
    }

    resolveIconClass(object: ComponentsTreeItem): string {
        return object.getComponent().getIconClass();
    }
}
