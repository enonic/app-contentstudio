import {LayersWidgetStateView} from './LayersWidgetStateView';
import {EditContentEvent} from '../../../../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentInLayerViewer} from './ContentInLayerViewer';
import {ContentInLayer} from '../../../../content/ContentInLayer';
import i18n = api.util.i18n;

export class ContentInLayerItemViewInherited
    extends LayersWidgetStateView {

    private content: ContentSummaryAndCompareStatus;

    private viewer: ContentInLayerViewer;

    constructor(item: ContentInLayer, content: ContentSummaryAndCompareStatus) {
        super('inherited');

        this.content = content;
        this.viewer.setObjectAndContent(item, content);
    }

    protected initElements() {
        super.initElements();

        this.viewer = new ContentInLayerViewer();
    }

    protected getHeaderText(): string {
        return i18n('widget.layers.header.thisLayer');
    }

    protected getSubHeaderText(): string {
        return i18n('widget.layers.subheader.inherited');
    }

    protected getAction(): api.ui.Action {
        const action: api.ui.Action = new api.ui.Action(i18n('action.edit'));

        action.onExecuted(() => {
            new EditContentEvent([this.content]).fire();
        });

        return action;
    }

    protected doAppendChildren() {
        super.doAppendChildren();

        this.insertChild(this.viewer, 1);
    }
}
