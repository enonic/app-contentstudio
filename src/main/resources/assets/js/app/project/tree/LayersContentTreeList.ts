import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {LayerContent} from '../../view/context/widget/layers/LayerContent';
import {LayersContentTreeListHelper} from './LayersContentTreeListHelper';
import {LayerContentViewDataBlock} from '../../view/context/widget/layers/LayerContentViewDataBlock';
import {LayerContentView} from '../../view/context/widget/layers/LayerContentView';

export class LayersContentTreeList
    extends ListBox<LayerContent> {

    private helper: LayersContentTreeListHelper;

    private activeItemView: LayerContentViewDataBlock;

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

    protected createItemView(item: LayerContent, readOnly: boolean): LayerContentViewDataBlock {
        const itemView: LayerContentViewDataBlock = new LayerContentViewDataBlock(item, `${LayerContentView.VIEW_CLASS}-data`);
        itemView.addClass(`level-${this.helper.calcLevel(item)}`);

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
