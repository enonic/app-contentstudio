import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {StatusSelectionItem} from './StatusSelectionItem';
import {ShowDependenciesEvent} from '../browse/ShowDependenciesEvent';
import {EditContentEvent} from '../event/EditContentEvent';

export interface ArchiveItemConfig {
    viewer: Viewer<ContentSummaryAndCompareStatus>;
    item: ContentSummaryAndCompareStatus;
    clickable?: boolean;
}

export class ArchiveItem
    extends StatusSelectionItem {

    private static readonly HAS_INBOUND_CLASS = 'has-inbound';

    private static readonly CLICKABLE_CLASS = 'clickable';

    showRefButton: ActionButton;

    constructor(config: ArchiveItemConfig) {
        const {viewer, item, clickable = true} = config;
        super(viewer, item);

        this.addClass('archive-item');
        this.toggleClass(ArchiveItem.CLICKABLE_CLASS, clickable);

        this.initElements(clickable);
        this.initListeners(clickable);
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
        this.toggleClass(ArchiveItem.HAS_INBOUND_CLASS, hasInbound);
    }

    hasInbound(): boolean {
        return this.hasClass(ArchiveItem.HAS_INBOUND_CLASS);
    }

    protected initElements(clickable: boolean): void {
        this.initActionButton(clickable);
    }

    protected initActionButton(clickable: boolean): void {
        const action = new Action(i18n('action.showReferences'));
        action.onExecuted(() => {
            const contentId = this.getBrowseItem().getContentSummary().getContentId();
            new ShowDependenciesEvent(contentId, true).fire();
        });
        this.showRefButton = new ActionButton(action);
        this.showRefButton.addClass('show-ref-button');

        if (clickable) {
            this.showRefButton.onClicked(event => {
                event.stopPropagation();
                event.preventDefault();
            });
        }
    }

    protected initListeners(clickable: boolean): void {
        if (clickable) {
            this.onClicked(event => {
                if (!this.getBrowseItem().isPendingDelete()) {
                    new EditContentEvent([this.getBrowseItem()]).fire();
                }
            });
        }
    }

    getBrowseItem(): ContentSummaryAndCompareStatus {
        return super.getBrowseItem() as ContentSummaryAndCompareStatus;
    }
}
