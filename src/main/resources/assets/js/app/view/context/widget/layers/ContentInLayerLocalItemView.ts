import {ContentDeletePromptEvent} from '../../../../browse/ContentDeletePromptEvent';
import {ContentInLayer} from '../../../../content/ContentInLayer';
import {ContentInLayerItemView} from './ContentInLayerItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import i18n = api.util.i18n;
import SpanEl = api.dom.SpanEl;
import ActionButton = api.ui.button.ActionButton;

export class ContentInLayerLocalItemView
    extends ContentInLayerItemView {

    private subHeader: SpanEl;

    private button: ActionButton;

    private content: ContentSummaryAndCompareStatus;

    constructor(item: ContentInLayer, content: ContentSummaryAndCompareStatus) {
        super(item);

        this.addClass('local');
        this.content = content;
    }

    protected initElements() {

        super.initElements();

        this.subHeader = new SpanEl('sub-header').setHtml(i18n('widget.layers.subheader.local'));

        const action: api.ui.Action = new api.ui.Action(i18n('action.delete'));

        action.onExecuted(() => {
            new ContentDeletePromptEvent([this.content]).fire();
        });

        this.button = new ActionButton(action);
    }

    protected doSetItem(item: ContentInLayer) {
        super.doSetItem(item);

        this.header.setTitle(i18n('widget.layers.header.thisLayer'));
    }

    protected doAppendChildren() {
        super.doAppendChildren();
        this.appendChildren(this.subHeader, this.button);
    }

}
