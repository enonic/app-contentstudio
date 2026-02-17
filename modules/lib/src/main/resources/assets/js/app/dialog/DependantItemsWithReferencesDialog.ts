import {DependantItemsWithProgressDialog} from './DependantItemsWithProgressDialog';
import {DialogStateBar} from './DialogStateBar';
import {type DialogStateEntry} from './DialogStateEntry';
import {type ContentWithRefsResult} from '../resource/ContentWithRefsResult';
import {type ContentId} from '../content/ContentId';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {type ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type ArchiveCheckableItem} from './ArchiveCheckableItem';
import {type ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import type Q from 'q';
import {type ArchiveSelectableItem} from './ArchiveSelectableItem';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {type CmsContentResourceRequest} from '../resource/CmsContentResourceRequest';
import {DialogWithRefsDependantList} from '../remove/DialogWithRefsDependantList';
import {DialogWithRefsItemList, type DialogWithRefsItemListConfig} from '../remove/DialogWithRefsItemList';

export abstract class DependantItemsWithReferencesDialog extends DependantItemsWithProgressDialog {

    protected stateBar: DialogStateBar;

    protected inboundErrorsEntry: DialogStateEntry;

    protected resolveDependenciesResult: ContentWithRefsResult;

    protected referenceIds: ContentId[];

    protected initElements(): void {
        super.initElements();

        this.stateBar = new DialogStateBar({hideIfResolved: true});
        this.inboundErrorsEntry = this.stateBar.addErrorEntry({
            text: i18n('dialog.archive.warning.text'),
            actionButtons: [{
                label: i18n('dialog.archive.warning.ignore'),
                markIgnored: true,
            }],
        });
    }

    protected initListeners(): void {
        super.initListeners();

        const itemsAddedHandler = (items: ContentSummaryAndCompareStatus[], itemList: ListBox<ContentSummaryAndCompareStatus>) => {
            if (this.resolveDependenciesResult) {
                this.updateItemViewsWithInboundDependencies(items.map(item => itemList.getItemView(item) as ArchiveCheckableItem));
            }
        };

        this.getItemList().onItemsAdded(items => itemsAddedHandler(items, this.getItemList()));
        this.getDependantList().onItemsAdded(items => itemsAddedHandler(items, this.getDependantList()));
        this.getItemList().onItemsRemoved(() => this.onListItemsRemoved());

        this.stateBar.onResolvedStateChange(resolved => this.toggleControls(resolved));

        const handleRefsChange = this.handleRefsChange.bind(this);
        ContentServerEventsHandler.getInstance().onContentUpdated(handleRefsChange);
        ContentServerEventsHandler.getInstance().onContentDeleted(handleRefsChange);
    }

    private updateItemViewsWithInboundDependencies(itemViews: (ArchiveCheckableItem | ArchiveSelectableItem)[]) {
        itemViews.forEach((itemView) => {
            const hasInbound = this.hasInboundRef(itemView.getItem().getId());
            itemView.setHasInbound(hasInbound);
        });
    }

    private hasInboundRef(id: string): boolean {
        return this.resolveDependenciesResult?.hasInboundDependency(id);
    }

    private handleRefsChange(items: ContentSummaryAndCompareStatus[] | ContentServerChangeItem[]): void {
        if (!this.isOpen()) {
            return;
        }
        const contentIds = items.map(item => item.getContentId());
        const referringWasUpdated = this.referenceIds.find(id => contentIds.some(contentId => contentId.equals(id)));
        if (referringWasUpdated) {
            this.refreshInboundRefs();
        }
    }

    private refreshInboundRefs(): Q.Promise<void> {
        return this.resolveDescendants()
            .then(() => this.resolveItemsWithInboundRefs(true))
            .then(() => {
                if (!this.resolveDependenciesResult.hasInboundDependencies()) {
                    this.unlockMenu();
                }
            }).catch(DefaultErrorHandler.handle);
    }

    protected resolveDescendants(): Q.Promise<ContentId[]> {
        const ids: ContentId[] = this.getItemList().getItems().map(content => content.getContentId());
        return this.createResolveRequest(ids).sendAndParse().then((result: ContentWithRefsResult) => {
            this.resolveDependenciesResult = result;
            this.resolveReferanceIds();
            return result.getContentIds();
        });
    }

    protected abstract createResolveRequest(ids: ContentId[]): CmsContentResourceRequest<ContentWithRefsResult>;

    protected resolveItemsWithInboundRefs(forceUpdate?: boolean): void {
        this.getDependantList().setResolveDependenciesResult(this.resolveDependenciesResult);

        const itemsWithInboundRefs: ContentId[] =
            this.dependantIds.filter((id: ContentId) => this.hasInboundRef(id.toString()));
        this.dependantIds = this.dependantIds.filter((contentId: ContentId) => !this.hasInboundRef(contentId.toString()));
        this.dependantIds.unshift(...itemsWithInboundRefs);

        const inboundCount = this.resolveDependenciesResult.getInboundDependencies().length;
        this.updateWarningLine(inboundCount);

        const hasInboundDeps = this.resolveDependenciesResult.hasInboundDependencies();

        if (hasInboundDeps || forceUpdate) {
            const views = [...this.getItemList().getItemViews(), ...this.getDependantList().getItemViews()];
            this.updateItemViewsWithInboundDependencies(views);
        }
    }

    private resolveReferanceIds(): void {
        this.referenceIds = this.resolveDependenciesResult.getInboundDependencies().reduce((prev, curr) => {
            return prev.concat(curr.getInboundDependencies());
        }, [] as ContentId[]);
    }

    private updateWarningLine(inboundCount: number): void {
        const dependenciesExist = inboundCount > 0;

        if (dependenciesExist) {
            this.stateBar.markChecking(true);
        }

        this.inboundErrorsEntry.updateCount(inboundCount);

        if (dependenciesExist) {
            setTimeout(() => {
                this.stateBar.markChecking(false);
            }, 1000);
        }
    }

    protected lockControls(): void {
        super.lockControls();
        this.lockMenu();
        this.stateBar.setEnabled(false);
    }

    protected unlockControls(): void {
        super.unlockControls();
        this.unlockMenu();
        this.stateBar.setEnabled(true);
    }

    close() {
        super.close();

        this.stateBar.reset();
        this.resolveDependenciesResult = null;
    }

    protected abstract lockMenu(): void;

    protected abstract unlockMenu(): void;

    protected createDependantList(): DialogWithRefsDependantList {
        const observer = this.createObserverConfig();
        return new DialogWithRefsDependantList(observer);
    }

    protected getDependantList(): DialogWithRefsDependantList {
        return super.getDependantList() as DialogWithRefsDependantList;
    }

    protected createItemList(): DialogWithRefsItemList {
        return new DialogWithRefsItemList(this.createItemListConfig());
    }

    protected createItemListConfig(): DialogWithRefsItemListConfig {
        return null;
    }

    protected getItemList(): DialogWithRefsItemList {
        return super.getItemList() as DialogWithRefsItemList;
    }

    protected manageDescendants(): void {
        this.showLoadMask();
        this.lockControls();

        this.loadDescendantIds().then(() => {
            this.resolveItemsWithInboundRefs();

            return this.cleanLoadDescendants().then((descendants: ContentSummaryAndCompareStatus[]) => {
                this.setDependantItems(descendants);
            }).finally(() => {
                this.notifyResize();
                this.hideLoadMask();
                this.unlockControls();
                this.handleDescendantsLoaded();
                this.updateTabbable();
                this.actionButton.giveFocus();

                const hasInboundDeps = this.resolveDependenciesResult.hasInboundDependencies();
                if (hasInboundDeps) {
                    this.lockMenu();
                }
            });
        }).catch((reason: unknown) => {
            DefaultErrorHandler.handle(reason);
        });
    }

    protected onListItemsRemoved(): void {
        if (!this.isIgnoreItemsChanged()) {
            this.manageDescendants();
        }
    }

    protected handleDescendantsLoaded(): void {
        //
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addCancelButtonToBottom();
            this.prependChildToContentPanel(this.stateBar);

            return rendered;
        });
    }
}
