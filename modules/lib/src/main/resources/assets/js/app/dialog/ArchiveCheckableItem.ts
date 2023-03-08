import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ShowDependenciesEvent} from '../browse/ShowDependenciesEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../event/EditContentEvent';
import {StatusCheckableItem, StatusCheckableItemConfig} from './StatusCheckableItem';
import {DependencyType} from '../browse/DependencyType';
import {DependencyParams} from '../browse/DependencyParams';
import {ContentId} from '../content/ContentId';

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
        this.initActionButton();
    }

    protected initActionButton(): void {
        const action = new Action(i18n('action.showReferences'));
        action.onExecuted(() => {
            const contentId: ContentId = this.getItem().getContentSummary().getContentId();
            const params: DependencyParams =
                DependencyParams.create().setContentId(contentId).setDependencyType(DependencyType.INBOUND).build();
            new ShowDependenciesEvent(params).fire();
        });

        this.showRefButton = new ActionButton(action);
        this.showRefButton.addClass('show-ref-button');
    }

    protected initListeners(): void {
        super.initListeners();

        if (!this.config.clickable) {
            return;
        }

        this.onClicked(() => {
            if (!this.getItem().isPendingDelete()) {
                new EditContentEvent([this.getItem()]).fire();
            }
        });

        this.showRefButton.onClicked(event => {
            event.stopPropagation();
            event.preventDefault();
        });
    }
}
