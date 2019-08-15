import {LayersWidgetStateView} from './LayersWidgetStateView';
import {LayerDialogsManager} from '../../../../layer/LayerDialogsManager';
import {ContentLayer} from '../../../../content/ContentLayer';
import i18n = api.util.i18n;

export class LayersWidgetStateViewNoLayers
    extends LayersWidgetStateView {

    constructor() {
        super('no-layers');
    }

    protected getHeaderText(): string {
        return i18n('widget.layers.header.noLayers');
    }

    protected getSubHeaderText(): string {
        return i18n('widget.layers.subheader.noLayers');
    }

    protected getAction(): api.ui.Action {
        const action: api.ui.Action = new api.ui.Action(i18n('widget.layers.button.create'));

        action.onExecuted(() => {
            LayerDialogsManager.get().openCreateLayerDialog(ContentLayer.DEFAULT_LAYER_NAME);
        });

        return action;
    }
}
