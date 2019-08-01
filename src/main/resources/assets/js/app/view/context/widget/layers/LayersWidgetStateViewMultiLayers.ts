import {LayersWidgetStateView} from './LayersWidgetStateView';
import {ContentLayer} from '../../../../content/ContentLayer';
import {LayerViewer} from '../../../../layer/LayerViewer';
import {LayerDetailsDialog} from '../../../../layer/LayerDetailsDialog';
import {LayersListDialog} from '../../../../layer/LayersListDialog';
import i18n = api.util.i18n;

export class LayersWidgetStateViewMultiLayers
    extends LayersWidgetStateView {

    private viewer: LayerViewer;

    private layer: ContentLayer;

    constructor(layer: ContentLayer) {
        super('multi-layers');

        this.layer = layer;
        this.viewer.setObject(layer);
    }

    protected initElements() {
        this.button = new api.ui.button.ActionButton(this.getAction());
        this.viewer = new LayerViewer();
    }

    protected doAppendChildren() {
        this.appendChild(this.viewer);
        this.appendChild(this.button);
    }

    protected getAction(): api.ui.Action {
        const action: api.ui.Action = new api.ui.Action(i18n('widget.layers.button.settings'));

        action.onExecuted(() => {
            const layerDetailsDialog: LayerDetailsDialog = new LayerDetailsDialog(this.layer);
            layerDetailsDialog.open();
            layerDetailsDialog.onBackButtonClicked(() => {
                LayersListDialog.get().open();
            });
        });

        return action;
    }
}
