import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {LayerContent} from '../../view/context/widget/layers/LayerContent';
import {LayersContentTreeListItemView} from './LayersContentTreeListItemView';
import {LayersContentTreeListHelper} from './LayersContentTreeListHelper';

export class LayersContentTreeList
    extends ListBox<LayerContent> {

    private helper: LayersContentTreeListHelper;

    private activeItemView: LayersContentTreeListItemView;

    constructor() {
        super('layers-content-tree-list');

        this.helper = new LayersContentTreeListHelper();
    }

    protected getItemId(item: LayerContent): string {
        const projectName: string = item.getProject().getName();
        const contentId: string = item.hasItem() ? item.getItemId() : '';
        return `${projectName}:${contentId}`;
    }

    setItems(items: LayerContent[], silent?: boolean): void {
        this.helper.setItems(items);
        super.setItems(this.helper.sort(), silent);
    }

    protected createItemView(item: LayerContent, readOnly: boolean): LayersContentTreeListItemView {
        const itemView: LayersContentTreeListItemView = new LayersContentTreeListItemView(item, this.helper.calcLevel(item));

        itemView.onClicked(() => {
            if (this.activeItemView) {
                this.activeItemView.removeClass('expanded');
            }

            if (this.activeItemView === itemView) {
                this.activeItemView = null;
                return;
            }

            this.activeItemView = itemView;
            this.activeItemView.addClass('expanded');
        });

        return itemView;
    }

}
