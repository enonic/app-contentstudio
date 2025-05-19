import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import * as Q from 'q';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../event/EditContentEvent';
import {StatusCheckableItem, StatusCheckableItemConfig} from './StatusCheckableItem';
import {ArchiveDialogHelper} from './ArchiveDialogHelper';

export interface ArchiveItemConfig
    extends StatusCheckableItemConfig {
    clickable?: boolean;
}

export class ArchiveCheckableItem
    extends StatusCheckableItem {

    private static readonly HAS_INBOUND_CLASS = 'has-inbound';

    private static readonly CLICKABLE_CLASS = 'clickable';

    protected readonly config: ArchiveItemConfig;

    showRefButton: ActionButton;

    constructor(config: ArchiveItemConfig) {
        const {clickable = true} = config;
        super({clickable, ...config});

        this.addClass('archive-item');
        this.toggleClass(ArchiveCheckableItem.CLICKABLE_CLASS, clickable);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.showRefButton.insertBeforeEl(this.status);
            return rendered;
        });
    }

    setObject(obj: ContentSummaryAndCompareStatus) {
        const viewer = this.getViewer();

        viewer.setObject(obj);
        this.status.setHtml(obj.getStatusText());
    }

    setHasInbound(hasInbound: boolean): void {
        this.toggleClass(ArchiveCheckableItem.HAS_INBOUND_CLASS, hasInbound);
    }

    hasInbound(): boolean {
        return this.hasClass(ArchiveCheckableItem.HAS_INBOUND_CLASS);
    }

    protected initElements(): void {
        super.initElements();

        this.showRefButton = ArchiveDialogHelper.createShowReferences(this.getItem().getContentSummary().getContentId());
    }

    protected initListeners(): void {
        super.initListeners();

        if (!this.config.clickable) {
            return;
        }

        this.onClicked(() => {
            new EditContentEvent([this.getItem()]).fire();
        });
    }
}
