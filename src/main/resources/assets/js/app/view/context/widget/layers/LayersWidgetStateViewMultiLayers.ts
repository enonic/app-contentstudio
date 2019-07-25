import {LayersWidgetStateView} from './LayersWidgetStateView';
import {ContentLayer} from '../../../../content/ContentLayer';
import {LayerViewer} from '../../../../layer/LayerViewer';
import i18n = api.util.i18n;

export class LayersWidgetStateViewMultiLayers
    extends LayersWidgetStateView {

    private viewer: LayerViewer;

    constructor(layer: ContentLayer) {
        super('multi-layers');

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
            console.log('Layer Settings');
        });

        return action;
    }
}
