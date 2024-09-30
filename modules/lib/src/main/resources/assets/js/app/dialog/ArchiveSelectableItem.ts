import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import * as Q from 'q';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../event/EditContentEvent';
import {StatusSelectionItem} from './StatusSelectionItem';
import {Branch} from '../versioning/Branch';
import {ArchiveDialogHelper} from './ArchiveDialogHelper';

export interface ArchiveSelectableItemConfig {
    viewer: Viewer<ContentSummaryAndCompareStatus>;
    item: ContentSummaryAndCompareStatus;
    clickable?: boolean;
    target?: Branch;
}

export class ArchiveSelectableItem
    extends StatusSelectionItem {

    private static readonly HAS_INBOUND_CLASS = 'has-inbound';

    private static readonly CLICKABLE_CLASS = 'clickable';

    protected config: ArchiveSelectableItemConfig;

    showRefButton: ActionButton;

    constructor(config: ArchiveSelectableItemConfig) {
        const {viewer, item, clickable = true} = config;
        super(viewer, item);

        this.config = config;

        this.addClass('archive-item');
        this.toggleClass(ArchiveSelectableItem.CLICKABLE_CLASS, clickable);

        this.initElements();
        this.initListeners();
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
        this.toggleClass(ArchiveSelectableItem.HAS_INBOUND_CLASS, hasInbound);
    }

    hasInbound(): boolean {
        return this.hasClass(ArchiveSelectableItem.HAS_INBOUND_CLASS);
    }

    protected initElements(): void {
        this.showRefButton = ArchiveDialogHelper.createShowReferences(this.getItem().getContentSummary().getContentId(), this.config.target);
    }

    protected initListeners(): void {
        if (this.config.clickable ?? true) {
            this.onClicked(event => {
                if (!this.getItem().isPendingDelete()) {
                    new EditContentEvent([this.getItem()]).fire();
                }
            });
        }
    }

    getItem(): ContentSummaryAndCompareStatus {
        return super.getBrowseItem() as ContentSummaryAndCompareStatus;
    }
}
