import {ContentLayer} from '../content/ContentLayer';
import {LayerViewer} from './LayerViewer';
import {LayersList, LayersListItem} from './LayersList';
import {LayerContext} from './LayerContext';
import {LayerChangedEvent} from './LayerChangedEvent';
import {LayerDialogsManager} from './LayerDialogsManager';
import {LayersHelper} from './LayersHelper';
import {ContentLayerExtended} from './ContentLayerExtended';
import DivEl = api.dom.DivEl;
import DropdownHandle = api.ui.button.DropdownHandle;
import H6El = api.dom.H6El;
import i18n = api.util.i18n;
import PEl = api.dom.PEl;
import ButtonEl = api.dom.ButtonEl;
import Element = api.dom.Element;

export class LayerSelector
    extends DivEl {

    private header: DivEl;

    private headerLayerViewer: LayerViewer;

    private layersList: SelectableLayersList;

    private layersListHeader: DivEl;

    private dropdownHandle: DropdownHandle;

    private isLayersListShown: boolean = false;

    private clickOutsideListener: (event: MouseEvent) => void;

    constructor() {
        super('layer-selector');

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.header = new DivEl('selected-layer-view');
        this.headerLayerViewer = new LayerViewer();
        this.dropdownHandle = new DropdownHandle();
        this.layersListHeader = this.createLayersListHeader();
        this.layersList = new SelectableLayersList();
        this.clickOutsideListener = this.createClickOutsideListener();
    }

    private createClickOutsideListener() {
        return (event: MouseEvent) => {
            if (this.isVisible()) {
                for (let element = event.target; element; element = (<any>element).parentNode) {
                    if (element === this.getHTMLElement()) {
                        return;
                    }
                }

                if (this.isLayersListShown) {
                    this.hideLayersList();
                }
            }
        };
    }

    setLayers(layers: ContentLayer[]) {
        const selectedLayer: ContentLayer = LayerContext.get().getCurrentLayer();
        this.headerLayerViewer.setObject(selectedLayer);

        this.layersList.setItems(LayersHelper.sortAndExtendLayers(layers));
        this.layersList.selectLayer(selectedLayer);

        this.layersList.onSelectionChanged((layer: ContentLayer) => {
            this.handleSelectedLayerChanged(layer);
        });
    }

    private initListeners() {
        this.headerLayerViewer.onClicked((event: MouseEvent) => {
            this.toggleLayerListShown();
        });

        LayerChangedEvent.on(() => {
            this.headerLayerViewer.setObject(LayerContext.get().getCurrentLayer());
        });

        this.handleDropdownKeyEvents();
    }

    private toggleLayerListShown() {
        if (this.isLayersListShown) {
            this.hideLayersList();
        } else {
            this.showLayersList();
        }
    }

    private handleDropdownKeyEvents() {
        const keyBindings = [
            new api.ui.KeyBinding('space', this.toggleLayerListShown.bind(this)).setGlobal(true),
            new api.ui.KeyBinding('enter', this.toggleLayerListShown.bind(this)).setGlobal(true)];

        this.dropdownHandle.onFocus(() => {
            api.ui.KeyBindings.get().bindKeys(keyBindings);
        });

        this.dropdownHandle.onFocusOut(() => {
            api.ui.KeyBindings.get().unbindKeys(keyBindings);
        });
    }

    private handleSelectedLayerChanged(layer: ContentLayer) {
        if (!layer.equals(LayerContext.get().getCurrentLayer())) {
            LayerContext.get().setCurrentLayer(layer);
        }

        this.hideLayersList();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.header.appendChildren(
                this.headerLayerViewer,
                this.dropdownHandle,
                this.layersListHeader
            );
            this.appendChildren(
                this.header,
                this.layersList
            );

            this.dropdownHandle.up();
            this.layersListHeader.hide();
            this.layersList.hide();

            return rendered;
        });
    }

    private showLayersList() {
        this.addClass('open');
        api.ui.KeyBindings.get().shelveBindings();
        api.dom.Body.get().onMouseDown(this.clickOutsideListener);
        api.ui.mask.BodyMask.get().show();
        this.isLayersListShown = true;
        this.dropdownHandle.down();
        this.layersListHeader.show();
        this.layersList.show();
    }

    private hideLayersList() {
        this.removeClass('open');
        api.ui.KeyBindings.get().unshelveBindings();
        api.dom.Body.get().unMouseDown(this.clickOutsideListener);
        api.ui.mask.BodyMask.get().hide();
        this.isLayersListShown = false;
        this.dropdownHandle.up();
        this.layersListHeader.hide();
        this.layersList.hide();
    }

    private createOpenLayerListIcon(): ButtonEl {
        const cogIcon = new ButtonEl();
        cogIcon.addClass('icon-cog');
        cogIcon.onClicked(() => {
            this.hideLayersList();
            LayerDialogsManager.get().openLayersListDialog();
        });

        return cogIcon;
    }

    private createLayersListHeader(): DivEl {
        const header: DivEl = new DivEl('list-header');

        header.appendChildren(
            new H6El('main').setHtml(i18n('field.layers.list.header.main')),
            new PEl('sub').setHtml(i18n('field.layers.list.header.sub')),
            this.createOpenLayerListIcon()
        );

        return header;
    }
}

class SelectableLayersList
    extends LayersList {

    private selectedListItem: LayersListItem;

    private focusedListItem: LayersListItem;

    private selectionChangedListeners: { (layer: ContentLayer): void } [] = [];

    constructor() {
        super();

        this.initListeners();
    }

    private initListeners() {
        this.onShown(() => {
            if (this.selectedListItem) {
                this.selectedListItem.giveFocus();
            }

            this.bindKeys();
        });
    }

    private bindKeys() {
        const keyBindings = [
            new api.ui.KeyBinding('up', () => {
                this.focusPreviousItem();
            }).setGlobal(true),
            new api.ui.KeyBinding('down', () => {
                this.focusNextItem();
            }).setGlobal(true),
            new api.ui.KeyBinding('tab', (e: ExtendedKeyboardEvent) => {
                e.preventDefault();
                e.stopPropagation();
                this.focusNextItem();
            }).setGlobal(true),
            new api.ui.KeyBinding('enter', () => {
                this.handleListItemSelected(this.focusedListItem);
            }).setGlobal(true)];

        api.ui.KeyBindings.get().bindKeys(keyBindings);
    }

    protected createItemView(item: ContentLayerExtended, readOnly: boolean): LayersListItem {
        const layersListItem: LayersListItem = super.createItemView(item, readOnly);

        layersListItem.onClicked(() => {
            this.handleListItemSelected(layersListItem);
        });

        layersListItem.onFocus(() => {
            this.focusedListItem = layersListItem;
        });

        layersListItem.getEl().setTabIndex(0);

        return layersListItem;
    }

    private handleListItemSelected(layersListItem: LayersListItem) {
        if (layersListItem === this.selectedListItem) {
            return;
        }

        this.selectedListItem.removeClass('selected');
        layersListItem.addClass('selected');
        this.selectedListItem = layersListItem;

        this.notifySelectionChanged();
    }

    selectLayer(layer: ContentLayer) {
        this.getItemViews().some((view: LayersListItem) => {
            if (view.getLayer().equals(layer)) {
                view.addClass('selected');
                this.selectedListItem = view;
                return true;
            }

            return false;
        });
    }

    private focusNextItem() {
        const nextElement: Element = this.focusedListItem.getNextElement();
        if (nextElement) {
            nextElement.giveFocus();
        } else {
            this.getFirstChild().giveFocus();
        }
    }

    private focusPreviousItem() {
        const previousElement: Element = this.focusedListItem.getPreviousElement();
        if (previousElement) {
            previousElement.giveFocus();
        } else {
            this.getLastChild().giveFocus();
        }
    }

    onSelectionChanged(listener: (layer: ContentLayer) => void) {
        this.selectionChangedListeners.push(listener);
    }

    private notifySelectionChanged() {
        this.selectionChangedListeners.forEach((listener) => {
            listener(this.selectedListItem.getLayer());
        });
    }

}
