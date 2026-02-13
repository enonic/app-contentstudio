import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {type ComponentsTreeItem} from './ComponentsTreeItem';

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

    doLayout(object: ComponentsTreeItem): void {
        super.doLayout(object);

        if (object.isInvalid()) {
            this.addClass('invalid');
            this.namesAndIconView.getFirstChild().addClass('icon-state-invalid');
        }

        this.addClass(object.getType().toString());
    }
}
