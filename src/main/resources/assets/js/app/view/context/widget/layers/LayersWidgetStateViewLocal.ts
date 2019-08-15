import {LayersWidgetStateView} from './LayersWidgetStateView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentDeletePromptEvent} from '../../../../browse/ContentDeletePromptEvent';
import {LayerContext} from '../../../../layer/LayerContext';
import {ContentOfLayerViewer} from '../../../../layer/ContentOfLayerViewer';
import i18n = api.util.i18n;

export class LayersWidgetStateViewLocal
    extends LayersWidgetStateView {

    private viewer: ContentOfLayerViewer;

    private item: ContentSummaryAndCompareStatus;

    constructor(item: ContentSummaryAndCompareStatus) {
        super('local');

        this.item = item;
        this.viewer.setObjects(LayerContext.get().getCurrentLayer(), this.item);
    }

    protected initElements() {
        super.initElements();
        this.viewer = new ContentOfLayerViewer();
    }

    protected doAppendChildren() {
        this.appendChild(this.viewer);
        this.appendChild(this.subHeader);
        this.appendChild(this.button);
    }

    protected getSubHeaderText(): string {
        return i18n('widget.layers.subheader.local');
    }

    protected getAction(): api.ui.Action {
        const action: api.ui.Action = new api.ui.Action(i18n('action.delete'));

        action.onExecuted(() => {
            new ContentDeletePromptEvent([this.item]).fire();
        });

        return action;
    }
}
