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
import KeyBinding = api.ui.KeyBinding;
import KeyBindings = api.ui.KeyBindings;
import ObjectHelper = api.ObjectHelper;
import KeyBindingAction = api.ui.KeyBindingAction;

export class LayerSelector
    extends DivEl {

    private headerLayerViewer: LayerViewer;

    private layersList: SelectableLayersList;

    private layersListHeader: DivEl;

    private dropdownHandle: DropdownHandle;

    private openLayersListButton: ButtonEl;

    private isLayersListShown: boolean = false;

    private clickOutsideListener: (event: MouseEvent) => void;

    private keyBindings: KeyBinding[];

    private focusedElement: api.dom.Element;

    constructor() {
        super('layer-selector');

        this.initElements();
        this.initListeners();
        this.initKeyBindings();
    }

    private initElements() {
        this.headerLayerViewer = new LayerViewer();
        this.dropdownHandle = this.focusedElement = new DropdownHandle();
        this.openLayersListButton = new ButtonEl();
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
                    this.dropdownHandle.giveFocus();
                }
            }
        };
    }

    setLayers(layers: ContentLayer[]) {
        const selectedLayer: ContentLayer = LayerContext.get().getCurrentLayer();
        this.headerLayerViewer.setObject(selectedLayer);

        this.layersList.setItems(LayersHelper.sortAndExtendLayers(layers));
        this.layersList.preSelectLayer(selectedLayer);

        this.layersList.onSelectionChanged((layer: ContentLayer) => {
            this.handleSelectedLayerChanged(layer);
        });
    }

    private initListeners() {
        this.headerLayerViewer.onClicked((event: MouseEvent) => {
            this.toggleLayerListShown();
        });

        this.dropdownHandle.onClicked((event: MouseEvent) => {
            this.toggleLayerListShown();
        });

        LayerChangedEvent.on(() => {
            this.headerLayerViewer.setObject(LayerContext.get().getCurrentLayer());
        });

        this.openLayersListButton.onClicked(() => {
            this.hideLayersList();
            LayerDialogsManager.get().openLayersListDialog();
        });

        this.dropdownHandle.onFocus(() => {
            this.focusedElement = this.dropdownHandle;
        });

        this.openLayersListButton.onFocus(() => {
            this.focusedElement = this.openLayersListButton;
        });

        this.layersList.onFocusChanged((listItem: LayersListItem) => {
            this.focusedElement = listItem;
        });
    }

    private toggleLayerListShown() {
        if (this.isLayersListShown) {
            this.hideLayersList();
        } else {
            this.showLayersList();
        }
    }

    private initKeyBindings() {
        this.keyBindings = [
            new api.ui.KeyBinding('esc', () => {
                this.hideLayersList();
                this.dropdownHandle.giveFocus();
            }).setGlobal(true),
            new api.ui.KeyBinding('up', () => {
                this.focusPreviousItem();
            }).setGlobal(true),
            new api.ui.KeyBinding('down', () => {
                this.focusNextItem();
            }).setGlobal(true),
            new api.ui.KeyBinding('tab', () => {
                this.handleTabPressed();
            }).setGlobal(true),
            new api.ui.KeyBinding('shift+tab', () => {
                this.handleShiftTabPressed();
            }).setGlobal(true),
            new api.ui.KeyBinding('enter', () => {
                this.handleEnterPressed();
            }, KeyBindingAction.KEYUP).setGlobal(true)
        ];
    }

    private focusNextItem() {
        if (this.focusedElement === this.dropdownHandle) {
            this.openLayersListButton.giveFocus();
        } else if (this.focusedElement === this.openLayersListButton) {
            this.layersList.getFirstChild().giveFocus();
        } else {
            const nextElement: Element = this.focusedElement.getNextElement();
            if (nextElement) {
                nextElement.giveFocus();
            } else {
                this.dropdownHandle.giveFocus();
            }
        }
    }

    private focusPreviousItem() {
        if (this.focusedElement === this.dropdownHandle) {
            this.layersList.getLastChild().giveFocus();
        } else if (this.focusedElement === this.openLayersListButton) {
            this.dropdownHandle.giveFocus();
        } else {
            const previousElement: Element = this.focusedElement.getPreviousElement();
            if (previousElement) {
                previousElement.giveFocus();
            } else {
                this.openLayersListButton.giveFocus();
            }
        }
    }

    private handleTabPressed() {
        if (this.focusedElement === this.layersList.getLastChild()) {
            this.hideLayersList();
        }
    }

    private handleShiftTabPressed() {
        if (this.focusedElement === this.dropdownHandle) {
            this.hideLayersList();
        }
    }

    private handleEnterPressed() {
        if (ObjectHelper.iFrameSafeInstanceOf(this.focusedElement, LayersListItem)) {
            this.layersList.selectListItem(<LayersListItem>this.focusedElement);
        }
    }

    private handleSelectedLayerChanged(layer: ContentLayer) {
        if (!layer.equals(LayerContext.get().getCurrentLayer())) {
            LayerContext.get().setCurrentLayer(layer);
        }

        this.hideLayersList();
        this.dropdownHandle.giveFocus();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.openLayersListButton.addClass('icon-cog');
            const header: DivEl = new DivEl('selected-layer-view');
            header.appendChildren(
                this.headerLayerViewer,
                this.dropdownHandle,
                this.layersListHeader
            );
            this.appendChildren(
                header,
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
        this.bindKeys();
    }

    private bindKeys() {
        KeyBindings.get().bindKeys(this.keyBindings);
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
        this.unBindKeys();
    }

    private unBindKeys() {
        KeyBindings.get().unbindKeys(this.keyBindings);
    }

    private createLayersListHeader(): DivEl {
        const header: DivEl = new DivEl('list-header');

        header.appendChildren(
            new H6El('main').setHtml(i18n('field.layers.list.header.main')),
            new PEl('sub').setHtml(i18n('field.layers.list.header.sub')),
            this.openLayersListButton
        );

        return header;
    }
}

class SelectableLayersList
    extends LayersList {

    private selectedListItem: LayersListItem;

    private selectionChangedListeners: { (layer: ContentLayer): void } [] = [];

    private focusChangedListeners: { (listItem: LayersListItem): void } [] = [];

    protected createItemView(item: ContentLayerExtended, readOnly: boolean): LayersListItem {
        const layersListItem: LayersListItem = super.createItemView(item, readOnly);

        layersListItem.onClicked(() => {
            this.selectListItem(layersListItem);
        });

        layersListItem.onFocus(() => {
            this.notifyFocusChanged(layersListItem);
        });

        layersListItem.getEl().setTabIndex(0);

        return layersListItem;
    }

    selectListItem(layersListItem: LayersListItem) {
        if (layersListItem === this.selectedListItem) {
            return;
        }

        this.selectedListItem.removeClass('selected');
        layersListItem.addClass('selected');
        this.selectedListItem = layersListItem;

        this.notifySelectionChanged();
    }

    preSelectLayer(layer: ContentLayer) {
        this.getItemViews().some((view: LayersListItem) => {
            if (view.getLayer().equals(layer)) {
                view.addClass('selected');
                this.selectedListItem = view;
                return true;
            }

            return false;
        });
    }

    onSelectionChanged(listener: (layer: ContentLayer) => void) {
        this.selectionChangedListeners.push(listener);
    }

    private notifySelectionChanged() {
        this.selectionChangedListeners.forEach((listener) => {
            listener(this.selectedListItem.getLayer());
        });
    }

    onFocusChanged(listener: (listItem: LayersListItem) => void) {
        this.focusChangedListeners.push(listener);
    }

    private notifyFocusChanged(listItem: LayersListItem) {
        this.focusChangedListeners.forEach((listener) => {
            listener(listItem);
        });
    }

}
