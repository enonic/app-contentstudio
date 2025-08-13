import {CheckableItem, CheckableItemConfig} from '@enonic/lib-admin-ui/app/browse/CheckableItem';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

enum StatusCheckableItemStatus {
    HIDDEN = 'hidden',
}

export type StatusCheckableItemConfig = CheckableItemConfig<ContentSummaryAndCompareStatus> & {
    checkbox?: {
        nonSelectableTooltip?: string;
    }
    hidden?: boolean | (() => boolean);
};

export class StatusCheckableItem
    extends CheckableItem<ContentSummaryAndCompareStatus> {

    declare protected config: StatusCheckableItemConfig;

    protected status: DivEl;

    protected clickTooltip: Tooltip;

    constructor(config: StatusCheckableItemConfig) {
        super(config);

        this.addClass('status-checkable-item');
    }

    refreshSelectable(): void {
        super.refreshSelectable();

        if (typeof this.config.hidden === 'function') {
            const isHidden = this.config.hidden();
            if (isHidden) {
                this.checkbox?.setEnabled(false);
            }
            this.toggleClass(StatusCheckableItemStatus.HIDDEN, isHidden);
        }
    }

    protected initElements() {
        super.initElements();
        this.initStatus();
        this.initTooltip();
    }

    protected initListeners(): void {
        super.initListeners();

        this.checkbox?.onClicked(() => {
            if (!this.isSelectable()) {
                Tooltip.hideOtherInstances();
                this.clickTooltip?.showFor(1500);
            }
        });
    }

    setObject(object: ContentSummaryAndCompareStatus) {
        const viewer = this.getViewer();
        this.status.removeClass(viewer.getObject().getStatusClass());

        viewer.setObject(object);
        this.status.setHtml(object.getStatusText());
        this.status.addClass(object.getStatusClass());
    }

    private initStatus(): void {
        const {item} = this.config;
        this.status = new DivEl(`status ${item.getStatusClass() ?? ''}`);
        this.status.setHtml(item.getStatusText());
    }

    private initTooltip(): void {
        if (this.checkbox) {
            const tooltipText = this.config.checkbox?.nonSelectableTooltip ?? i18n('tooltip.list.itemRequired');
            this.clickTooltip = new Tooltip(this.checkbox, tooltipText);
            this.clickTooltip.setTrigger(Tooltip.TRIGGER_NONE);
        }
    }

    protected renderContent(rendered: boolean): boolean {
        const result = super.renderContent(rendered);
        this.appendChild(this.status);
        return result;
    }
}
