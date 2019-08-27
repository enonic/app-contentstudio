import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentInLayer} from '../../../../content/ContentInLayer';
import {GetContentsInLayersByIdRequest} from '../../../../resource/GetContentsInLayersByIdRequest';
import {ContentLayer} from '../../../../content/ContentLayer';
import {LayerContext} from '../../../../layer/LayerContext';
import {ContentInLayerItemViewInherited} from './ContentInLayerItemViewInherited';
import {LayersWidgetState} from './LayersWidgetState';
import {ContentInLayerItemView} from './ContentInLayerItemView';
import {ContentInLayerLocalItemView} from './ContentInLayerLocalItemView';
import ContentId = api.content.ContentId;
import i18n = api.util.i18n;

export class ContentsInLayersView
    extends api.ui.selector.list.ListBox<ContentInLayer> {

    private content: ContentSummaryAndCompareStatus;

    private helper: ContentInLayerHelper;

    private state: LayersWidgetState;

    private loadedListeners: { (): void }[] = [];

    constructor() {
        super('content-in-layers-view');
        this.helper = new ContentInLayerHelper();
    }

    getItemId(item: ContentInLayer): string {
        return item.getLayer();
    }


    getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
    }

    setContentData(item: ContentSummaryAndCompareStatus) {
        this.content = item;
    }

    setState(value: LayersWidgetState) {
        this.state = value;
        if (this.state === LayersWidgetState.NO_LAYERS) {
            this.clearItems();
        }
    }

    reload(): wemQ.Promise<void> {

        if (!this.content || LayersWidgetState.NO_LAYERS === this.state) {
            this.clearItems();
            return wemQ(null);
        }

        const currentLayerName = LayerContext.get().getCurrentLayer().getName();
        return this.loadData().then((contentInLayers: ContentInLayer[]) => {
            const sortedContents = this.helper.sort(contentInLayers);
            const currLayerContents = sortedContents.filter(item => currentLayerName === item.getLayer());

            currLayerContents.length > 0 ? this.updateView(this.helper.filter(currLayerContents[0])) : this.updateView(sortedContents);

            this.notifyLoaded();
        });
    }

    private createToggleInheritedButton(): api.dom.ButtonEl {
        const button = new api.dom.ButtonEl('button-toggle-inherited');

        button.getEl().setInnerHtml('...').setTitle(i18n('widget.layers.button.toggle.inherited'));
        button.onClicked(() => button.addClass('show-inherited'));

        return button;
    }

    createItemView(item: ContentInLayer, readOnly: boolean): api.dom.Element {

        if (LayerContext.get().getCurrentLayer().getName() !== item.getLayer()) {
            const itemView = new ContentInLayerItemView(item);

            if (item.isInherited()) {
                const toggleButton = this.createToggleInheritedButton();
                itemView.addClass('inherited');
                itemView.prependChild(toggleButton);
                itemView.onAdded(() => toggleButton.insertBeforeEl(itemView));
            }

            return itemView;
        }

        switch (this.state) {
        case LayersWidgetState.NO_LAYERS:
            break;
        case LayersWidgetState.CURRENT_LAYER:
            return new ContentInLayerItemView(item);
        case LayersWidgetState.LOCAL:
            return new ContentInLayerLocalItemView(item, this.content);
        case LayersWidgetState.INHERITED:
            return new ContentInLayerItemViewInherited(item, this.content);
        }
    }

    private loadData(): wemQ.Promise<ContentInLayer[]> {
        if (!this.getContentId()) {
            throw new Error('Required contentId is not set');
        }

        return new GetContentsInLayersByIdRequest(this.getContentId(), false).sendAndParse().then(
            (contentInLayers: ContentInLayer[]) => {
                return contentInLayers;
            });
    }

    private updateView(contentInLayers: ContentInLayer[]) {
        this.setItems(contentInLayers);
    }

    onLoaded(listener: () => void) {
        this.loadedListeners.push(listener);
    }

    unLoaded(listener: () => void) {
        this.loadedListeners = this.loadedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyLoaded() {
        this.loadedListeners.forEach((listener) => {
            listener();
        });
    }
}

class ContentInLayerHelper {

    private contents: ContentInLayer[] = [];

    sort(contents: ContentInLayer[]): ContentInLayer[] {
        this.contents = contents;
        if (this.contents) {
            this.contents = this.contents.sort(this.doSort.bind(this));
        }

        return this.contents;
    }

    filter(target: ContentInLayer): ContentInLayer[] {
        return this.contents.filter(current =>
            this.isLayerAParentOfB(current, target) || current.getLayer() === target.getLayer()
        );
    }

    private doSort(a: ContentInLayer, b: ContentInLayer): number {
        if (this.isLayerAParentOfB(a, b)) {
            return -1;
        }

        if (this.isLayerAParentOfB(b, a)) {
            return 1;
        }

        return 0;
    }

    private isLayerAParentOfB(a: ContentInLayer, b: ContentInLayer): boolean {
        if (ContentLayer.DEFAULT_LAYER_NAME === a.getLayer()) {
            return true;
        }

        if (a.getLayer() === b.getParentLayer()) {
            return true;
        }

        const parentLayer: ContentInLayer = this.getParentLayer(b);

        if (!!parentLayer) {
            return this.isLayerAParentOfB(a, parentLayer);
        }

        return false;
    }

    private getParentLayer(contentInLayer: ContentInLayer): ContentInLayer {
        if (ContentLayer.DEFAULT_LAYER_NAME === contentInLayer.getLayer()) {
            return null;
        }

        const result: ContentInLayer[] = this.contents.filter(
            (item: ContentInLayer) => item.getLayer() === contentInLayer.getParentLayer());
        if (result.length > 0) {
            return result[0];
        }

        return null;
    }
}
