import {LayersWidgetStateView} from './LayersWidgetStateView';
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
            console.log('Create Layers');
        });

        return action;
    }
}
