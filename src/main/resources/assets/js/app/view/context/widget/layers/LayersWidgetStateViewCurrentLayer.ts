import {LayersWidgetStateView} from './LayersWidgetStateView';
import {LayerViewer} from '../../../../layer/LayerViewer';
import {LayerDetailsDialog} from '../../../../layer/LayerDetailsDialog';
import {LayersListDialog} from '../../../../layer/LayersListDialog';
import {LayerContext} from '../../../../layer/LayerContext';
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
            const layerDetailsDialog: LayerDetailsDialog = new LayerDetailsDialog(LayerContext.get().getCurrentLayer());
            layerDetailsDialog.open();
            layerDetailsDialog.onBackButtonClicked(() => {
                LayersListDialog.get().open();
            });
        });

        return action;
    }
}
