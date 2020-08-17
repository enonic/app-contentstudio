import * as Q from 'q';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {LayerContentView} from './LayerContentView';
import {MultiLayersContentLoader} from './MultiLayersContentLoader';
import {LayerContent} from './LayerContent';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectContext} from '../../../../project/ProjectContext';

export class LayersView extends ListBox<LayerContent> {

    private static EXPANDED_CLASS: string = `${LayerContentView.VIEW_CLASS}-expanded`;

    private currentItem: ContentSummaryAndCompareStatus;

    private activeItemView: LayerContentView;

    setCurrentItem(item: ContentSummaryAndCompareStatus) {
        this.currentItem = item;
    }

    createItemView(item: LayerContent, readOnly: boolean): LayerContentView {
        const itemContainer: LayerContentView = new LayerContentView(item);

        itemContainer.getDataBlock().onClicked(() => {
            if (this.activeItemView) {
                this.activeItemView.removeClass(LayersView.EXPANDED_CLASS);
            }

            if (this.activeItemView === itemContainer) {
                this.activeItemView = null;
                return;
            }

            this.activeItemView = itemContainer;
            this.activeItemView.addClass(LayersView.EXPANDED_CLASS);
        });

        if (item.getProject().getName() === ProjectContext.get().getProject().getName()) {
            this.activeItemView = itemContainer;
            this.activeItemView.addClass(LayersView.EXPANDED_CLASS);
        }

        return itemContainer;
    }

    getItemId(item: LayerContent): string {
        return `${item.getItem().getId()}:${item.getProject().getName()}`;
    }

    reload(): Q.Promise<void> {
        return this.loadData().then((items: LayerContent[]) => {
            this.updateView(items);
            return Q(null);
        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        });
    }

    private loadData(): Q.Promise<LayerContent[]> {
        return new MultiLayersContentLoader(this.currentItem).load();
    }

    private updateView(items: LayerContent[]) {
        this.clearItems();
        this.setItems(items);
    }

    setItems(items: LayerContent[], silent?: boolean): void {
        super.setItems(items, silent);

        if (this.getItemCount() < 2) {
            return;
        }

        this.hideInheritedItems();
    }

    private hideInheritedItems() {
        const reversedItemViews: LayerContentView[] = <LayerContentView[]>this.getItemViews().reverse();

        let parentIndex: number = -1;
        reversedItemViews.find((item: LayerContentView, index: number) => {
            parentIndex = index;
            return (index !== 0 && !item.getItem().isInherited()) || index === reversedItemViews.length -1;
        });

        const totalBetweenCurrentAndParent: number = parentIndex - 1;

        if (totalBetweenCurrentAndParent > 0) {
            this.hideItemsBetween(0, parentIndex);
        }

        if (parentIndex < reversedItemViews.length - 1) {
            this.hideItemsBetween(parentIndex, reversedItemViews.length);
        }
    }

    private hideItemsBetween(itemIndex: number, parentIndex: number) {
        const reversedItemViews: LayerContentView[] = <LayerContentView[]>this.getItemViews().reverse();
        const currentItem: LayerContentView = reversedItemViews[itemIndex];
        currentItem.addClass('has-more');

        const showMoreButtonEl: DivEl = new DivEl('show-more');
        showMoreButtonEl.setHtml(i18n('widget.layers.showmore', parentIndex - itemIndex -1));
        currentItem.getRelationBlock().appendChild(showMoreButtonEl);

        const hiddenItems: LayerContentView[] = [];

        for (let i: number = itemIndex + 1; i < parentIndex; i++) {
            const itemToHide: LayerContentView = reversedItemViews[i];
            hiddenItems.push(itemToHide);
            itemToHide.hide();
        }

        showMoreButtonEl.onClicked(() => {
            showMoreButtonEl.hide();
            currentItem.removeClass('has-more');

            hiddenItems.forEach((hiddenItem: LayerContentView) => {
                hiddenItem.show();
            });
        });
    }

}
