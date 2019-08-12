import {LayersWidgetStateView} from './LayersWidgetStateView';
import {LayerViewer} from '../../../../layer/LayerViewer';
import {LayerContext} from '../../../../layer/LayerContext';
import {LayerDialogsManager} from '../../../../layer/LayerDialogsManager';
import i18n = api.util.i18n;

export class LayersWidgetStateViewCurrentLayer
    extends LayersWidgetStateView {

    private viewer: LayerViewer;

    constructor() {
        super('multi-layers');

        this.viewer.setObject(LayerContext.get().getCurrentLayer());
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
            LayerDialogsManager.get().openLayerDetailsDialog(LayerContext.get().getCurrentLayer());
        });

        return action;
    }
}
