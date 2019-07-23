import {LayersWidgetStateView} from './LayersWidgetStateView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentDeletePromptEvent} from '../../../../browse/ContentDeletePromptEvent';
import i18n = api.util.i18n;

export class LayersWidgetStateViewLocal
    extends LayersWidgetStateView {

    private item: ContentSummaryAndCompareStatus;

    constructor(item: ContentSummaryAndCompareStatus) {
        super('local');

        this.item = item;
    }

    protected getHeaderText(): string {
        return i18n('widget.layers.header.local');
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
