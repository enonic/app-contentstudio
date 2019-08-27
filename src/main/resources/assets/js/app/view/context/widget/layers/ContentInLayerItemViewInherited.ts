import {LayersWidgetStateView} from './LayersWidgetStateView';
import {EditContentEvent} from '../../../../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import i18n = api.util.i18n;

export class ContentInLayerItemViewInherited
    extends LayersWidgetStateView {

    private item: ContentSummaryAndCompareStatus;

    constructor(item: ContentSummaryAndCompareStatus) {
        super('inherited');

        this.item = item;
    }

    protected getHeaderText(): string {
        return i18n('widget.layers.header.inherited');
    }

    protected getSubHeaderText(): string {
        return i18n('widget.layers.subheader.inherited');
    }

    protected getAction(): api.ui.Action {
        const action: api.ui.Action = new api.ui.Action(i18n('action.edit'));

        action.onExecuted(() => {
            new EditContentEvent([this.item]).fire();
        });

        return action;
    }
}
