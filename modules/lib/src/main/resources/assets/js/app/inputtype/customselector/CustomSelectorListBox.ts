import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorItemViewer} from './CustomSelectorItemViewer';
import {CustomSelectorLoader} from './CustomSelectorLoader';

export class CustomSelectorListBox
    extends LazyListBox<CustomSelectorItem> {

    private loader: CustomSelectorLoader;

    constructor(loader: CustomSelectorLoader) {
        super('custom-selector-list-box');

        this.loader = loader;
    }

    protected createItemView(item: CustomSelectorItem, readOnly: boolean): CustomSelectorItemViewer {
        const viewer = new CustomSelectorItemViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: CustomSelectorItem): string {
        return item.getId();
    }

    protected getScrollContainer(): Element {
        return this;
    }

    protected handleLazyLoad(): void {
        super.handleLazyLoad();

        if (this.loader.isPartiallyLoaded()) {
            this.loader.load(true);
        }
    }
}
