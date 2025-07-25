import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorItemViewer} from './CustomSelectorItemViewer';
import {CustomSelectorLoader} from './CustomSelectorLoader';
import {CustomSelectorMode, CustomSelectorModeHelper} from './CustomSelectorMode';

export class CustomSelectorListBox
    extends LazyListBox<CustomSelectorItem> {

    private readonly loader: CustomSelectorLoader;
    private readonly mode: CustomSelectorMode;

    constructor(loader: CustomSelectorLoader, mode: CustomSelectorMode) {
        super(CustomSelectorModeHelper.isGallery(mode) ? 'gallery-list-box' : 'custom-selector-list-box');

        this.mode = mode;
        this.loader = loader;
    }

    protected createItemView(item: CustomSelectorItem, readOnly: boolean): CustomSelectorItemViewer {
        const viewer = new CustomSelectorItemViewer(CustomSelectorModeHelper.isGallery(this.mode) ? 'gallery-item-viewer' : 'custom-selector-item-viewer');
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
