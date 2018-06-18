import '../../api.ts';
import {StatusSelectionItem} from './StatusSelectionItem';
import {DependantItemViewer} from './DependantItemViewer';
import ContentId = api.content.ContentId;
import GetDescendantsOfContentsRequest = api.content.resource.GetDescendantsOfContentsRequest;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import CompareStatus = api.content.CompareStatus;
import BrowseItem = api.app.browse.BrowseItem;
import ListBox = api.ui.selector.list.ListBox;
import LoadMask = api.ui.mask.LoadMask;
import DialogButton = api.ui.dialog.DialogButton;
import ContentSummaryAndCompareStatusViewer = api.content.ContentSummaryAndCompareStatusViewer;
import DivEl = api.dom.DivEl;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import i18n = api.util.i18n;

export interface DependantItemsDialogConfig
    extends ModalDialogConfig {
    dialogSubName?: string;
    dependantsName?: string;
    dependantsDescription?: string;
    showDependantList?: boolean;
}

export class DependantItemsDialog
    extends api.ui.dialog.ModalDialog {

    protected actionButton: DialogButton;

    protected autoUpdateTitle: boolean = false;

    private ignoreItemsChanged: boolean;

    private subTitle: api.dom.DivEl;

    private itemList: ListBox<ContentSummaryAndCompareStatus>;

    private dependantsContainer: api.dom.DivEl;

    private dependantContainerHeader: api.dom.H6El;

    private dependantContainerBody: api.dom.DivEl;

    private dependantList: ListBox<ContentSummaryAndCompareStatus>;

    private dependantsHeaderText: string;

    protected loadMask: LoadMask;

    protected loading: boolean = false;

    protected loadingRequested: boolean = false;

    protected previousScrollTop: number;

    protected dependantIds: ContentId[] = [];

    private showDependantList: boolean = true;

    constructor(config: DependantItemsDialogConfig) {
        super(config);

        this.addClass('dependant-dialog');

        this.getBody().addClass('mask-wrapper');

        this.subTitle = new api.dom.H6El('sub-title').setHtml(config.dialogSubName, false);
        this.appendChildToHeader(this.subTitle);

        this.itemList = this.createItemList();
        this.itemList.addClass('item-list');
        this.appendChildToContentPanel(this.itemList);

        let itemsChangedListener = () => {
            let count = this.itemList.getItemCount();
            if (this.autoUpdateTitle) {
                this.setTitle(config.title + (count > 1 ? 's' : ''));
            }
        };
        this.itemList.onItemsRemoved(itemsChangedListener);
        this.itemList.onItemsAdded(itemsChangedListener);

        this.dependantsHeaderText = config.dependantsName || this.getDependantsHeader(config.showDependantList);
        this.dependantContainerHeader = new api.dom.H6El('dependants-header').setHtml(this.dependantsHeaderText, false);
        this.dependantContainerHeader.onClicked(() => {
            const doShow = !this.dependantList.isVisible();
            this.setDependantListVisible(doShow);
            this.notifyResize();
        });

        this.dependantContainerBody = new api.dom.DivEl('dependants-body');
        if (config.dependantsDescription) {
            const desc = new api.dom.PEl('dependants-desc').setHtml(config.dependantsDescription, false);
            this.dependantContainerBody.appendChild(desc);
        }

        this.dependantList = this.createDependantList();
        this.dependantList.addClass('dependant-list');
        if (config.showDependantList !== undefined) {
            this.showDependantList = config.showDependantList;
        }
        this.dependantContainerBody.appendChild(this.dependantList);

        this.dependantsContainer = new api.dom.DivEl('dependants');
        this.dependantsContainer.appendChildren(this.dependantContainerHeader, this.dependantContainerBody);

        let dependantsChangedListener = () => {
            let doShow = this.countDependantItems() > 0;
            this.dependantsContainer.setVisible(doShow);

            if (doShow) {
                // update dependants header according to list visibility
                this.updateDependantsHeader(this.getDependantsHeader(this.dependantList.isVisible()));
                this.notifyResize();
            }
        };
        this.dependantList.onItemsRemoved(dependantsChangedListener);
        this.dependantList.onItemsAdded(dependantsChangedListener);

        this.appendChildToContentPanel(this.dependantsContainer);

        this.initLoadMask();

        this.getBody().onScrolled(() => {
            this.doPostLoad();
        });

        this.getBody().onScroll(() => {
            this.doPostLoad();
        });

    }

    public setDependantListVisible(visible: boolean) {
        this.dependantContainerBody.setVisible(visible);
        this.updateDependantsHeader(this.getDependantsHeader(visible));
    }

    protected getDependantsHeader(listVisible: boolean): string {
        return i18n(`dialog.${listVisible ? 'hide' : 'show' }Dependents`);
    }

    protected updateDependantsHeader(header?: string) {
        const count = this.countDependantItems();
        this.dependantContainerHeader.setHtml((header || this.dependantsHeaderText) + ` (${count})`, false);
    }

    private initLoadMask() {
        this.loadMask = new LoadMask(this.getContentPanel());
    }

    protected createItemList(): ListBox<ContentSummaryAndCompareStatus> {
        return new DialogItemList();
    }

    protected createDependantList(): ListBox<ContentSummaryAndCompareStatus> {
        return new DialogDependantList();
    }

    protected getItemList(): ListBox<ContentSummaryAndCompareStatus> {
        return this.itemList;
    }

    protected getDependantList(): ListBox<ContentSummaryAndCompareStatus> {
        return this.dependantList;
    }

    protected getDependantsContainer(): api.dom.DivEl {
        return this.dependantsContainer;
    }

    protected isIgnoreItemsChanged(): boolean {
        return this.ignoreItemsChanged;
    }

    protected setIgnoreItemsChanged(value: boolean) {
        this.ignoreItemsChanged = value;
    }

    show(hideLoadMask: boolean = false) {
        this.setDependantListVisible(this.showDependantList);
        super.show();
        if (!hideLoadMask) {
            this.appendChildToContentPanel(this.loadMask);
            this.loadMask.show();
        }
    }

    close(clearItems: boolean = true) {
        super.close();
        this.remove();
        if (clearItems) {
            this.itemList.clearItems(true);
            this.dependantList.clearItems(true);
        }
        this.dependantsContainer.setVisible(false);
        this.unlockControls();
    }

    setAutoUpdateTitle(value: boolean) {
        this.autoUpdateTitle = value;
    }

    setListItems(items: ContentSummaryAndCompareStatus[], silent?: boolean) {
        this.itemList.setItems(items, silent);
    }

    addListItems(items: ContentSummaryAndCompareStatus[], silent?: boolean) {
        this.itemList.addItems(items, silent);
    }

    removeListItems(items: ContentSummaryAndCompareStatus[], silent?: boolean) {
        this.itemList.removeItems(items, silent);
    }

    setDependantItems(items: ContentSummaryAndCompareStatus[]) {
        this.dependantList.setItems(items);
    }

    addDependantItems(items: ContentSummaryAndCompareStatus[]) {
        this.dependantList.addItems(items);
    }

    clearDependantItems() {
        this.dependantIds = [];
        this.dependantList.clearItems();
    }

    setSubTitle(text: string, escapeHtml?: boolean) {
        this.subTitle.setHtml(text, escapeHtml);
    }

    setSubTitleEl(el: DivEl) {
        if (this.subTitle) {
            this.subTitle.remove();
        }
        this.subTitle = el;
        this.appendChildToHeader(this.subTitle);
    }

    protected updateButtonCount(actionString: string, count: number) {
        this.actionButton.setLabel(count > 1 ? actionString + ' (' + count + ')' : actionString);
    }

    protected getContentsToLoad(): ContentSummaryAndCompareStatus[] {
        return this.getItemList().getItems();
    }

    protected loadDescendantIds(filterStatuses?: CompareStatus[]) {
        const contents = this.getContentsToLoad();

        const itemsIds = this.getItemList().getItems().map(content => content.getContentId());

        return new api.content.resource.GetDescendantsOfContentsRequest().setContentPaths(
            contents.map(content => content.getContentSummary().getPath())).setFilterStatuses(filterStatuses).sendAndParse()
            .then((result: ContentId[]) => {
                this.dependantIds = result;

                if (this.dependantIds) {
                    this.dependantIds = this.dependantIds.filter(dependantId =>
                        !api.util.ArrayHelper.contains(itemsIds, dependantId)
                    );
                }
            });
    }

    protected loadDescendants(from: number,
                              size: number): wemQ.Promise<ContentSummaryAndCompareStatus[]> {

        let ids = this.getDependantIds().slice(from, from + size);
        return api.content.resource.ContentSummaryAndCompareStatusFetcher.fetchByIds(ids);
    }

    protected countTotal(): number {
        return this.getItemList().getItemCount() + this.countDependantItems();
    }

    protected countDependantItems(): number {
        return this.getDependantIds().length;
    }

    protected getDependantIds(): ContentId[] {
        return this.dependantIds;
    }

    private doPostLoad() {
        if (this.previousScrollTop !== this.getBody().getEl().getScrollTop()) {
            setTimeout(this.postLoad.bind(this), 150);
        }
    }

    protected postLoad() {
        let lastVisible;

        const dialogBodyEl = this.getBody().getEl();
        this.previousScrollTop = dialogBodyEl.getScrollTop();

        let start = dialogBodyEl.getOffsetTop();
        let end = dialogBodyEl.getHeight() + start;

        let items = this.getDependantList().getItemViews();

        let visibleItems = [];

        items.forEach((item) => {
            let position = item.getEl().getOffsetTop();
            if (position >= start && position <= end) {
                visibleItems.push(item);
            }
        });

        lastVisible = items.indexOf(visibleItems[visibleItems.length - 1]);

        let size = this.getDependantList().getItemCount();

        if (!this.loading) {
            if (lastVisible + GetDescendantsOfContentsRequest.LOAD_SIZE / 2 >= size && size < this.getDependantIds().length) {

                this.loadMask.show();
                this.loading = true;

                this.loadDescendants(size, GetDescendantsOfContentsRequest.LOAD_SIZE).then((newItems) => {

                    this.addDependantItems(newItems);
                    this.loading = false;
                    this.loadMask.hide();
                    if (this.loadingRequested) {
                        this.loadingRequested = false;
                        this.postLoad();
                    }
                });
            }
        } else {
            this.loadingRequested = true;
        }
    }

    protected lockControls() {
        this.addClass('locked');
        this.actionButton.setEnabled(false);
        if (this.getCancelButton()) {
            this.getCancelButton().setEnabled(false);
        }
    }

    protected unlockControls() {
        this.removeClass('locked');
        this.actionButton.setEnabled(true);
        if (this.getCancelButton()) {
            this.getCancelButton().setEnabled(true);
        }
    }

    protected toggleControls(enable: boolean) {
        if (enable) {
            this.unlockControls();
        } else {
            this.lockControls();
        }
    }

}

export class DialogItemList
    extends ListBox<ContentSummaryAndCompareStatus> {

    private itemClickListeners: { (item: ContentSummaryAndCompareStatus): void }[] = [];

    protected createItemViewer(): ContentSummaryAndCompareStatusViewer {
        return new ContentSummaryAndCompareStatusViewer();
    }

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): StatusSelectionItem {
        const itemViewer = this.createItemViewer();

        itemViewer.setObject(item);

        let browseItem = <BrowseItem<ContentSummaryAndCompareStatus>>new BrowseItem<ContentSummaryAndCompareStatus>(item)
            .setId(item.getId())
            .setDisplayName(item.getDisplayName())
            .setPath(item.getPath().toString())
            .setIconUrl(new api.content.util.ContentIconUrlResolver().setContent(item.getContentSummary()).resolve());

        let statusItem = this.createSelectionItem(itemViewer, browseItem);

        statusItem.setIsRemovableFn(() => this.getItemCount() > 1);
        statusItem.setRemoveHandlerFn(() => this.removeItem(item));

        itemViewer.onClicked((event) => {
            const el = new api.dom.ElementHelper(<HTMLElement>event.target);
            if (!(el.hasClass('remove') || el.hasClass('include-children-toggler'))) {
                this.notifyItemClicked(item);
            }
        });

        return statusItem;
    }

    protected createSelectionItem(viewer: ContentSummaryAndCompareStatusViewer,
                                  browseItem: BrowseItem<ContentSummaryAndCompareStatus>): StatusSelectionItem {
        return new StatusSelectionItem(viewer, browseItem);
    }

    getItemId(item: ContentSummaryAndCompareStatus): string {
        return item.getContentSummary().getId();
    }

    getItemsIds(): ContentId[] {
        return this.getItems().map(item => item.getContentId());
    }

    getItems(): ContentSummaryAndCompareStatus[] {
        return <ContentSummaryAndCompareStatus[]>super.getItems();
    }


    onItemClicked(listener: (item: ContentSummaryAndCompareStatus) => void) {
        this.itemClickListeners.push(listener);
    }

    unItemClicked(listener: (item: ContentSummaryAndCompareStatus) => void) {
        this.itemClickListeners = this.itemClickListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyItemClicked(item: ContentSummaryAndCompareStatus) {
        this.itemClickListeners.forEach(listener => {
            listener(item);
        });
    }

}

export class DialogDependantList
    extends ListBox<ContentSummaryAndCompareStatus> {

    private itemClickListeners: { (item: ContentSummaryAndCompareStatus): void }[] = [];

    constructor(className?: string) {
        super(className);
    }

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): api.dom.Element {

        let dependantViewer = new DependantItemViewer();

        dependantViewer.setObject(item);

        dependantViewer.onClicked((event) => {
            const el = new api.dom.ElementHelper(<HTMLElement>event.target);
            if (!(el.hasClass('remove'))) {
                this.notifyItemClicked(item);
            }
        });

        let browseItem = <BrowseItem<ContentSummaryAndCompareStatus>>new BrowseItem<ContentSummaryAndCompareStatus>(item)
            .setId(item.getId())
            .setDisplayName(item.getDisplayName())
            .setPath(item.getPath().toString())
            .setIconUrl(new api.content.util.ContentIconUrlResolver().setContent(item.getContentSummary()).resolve());

        let selectionItem = new StatusSelectionItem(dependantViewer, browseItem);

        return selectionItem;
    }

    getItemId(item: ContentSummaryAndCompareStatus): string {
        return item.getContentSummary().getId();
    }

    setItems(items: ContentSummaryAndCompareStatus[], silent?: boolean) {
        items.sort(DialogDependantList.invalidAndReadOnlyOnTop);
        super.setItems(items, silent);
    }

    onItemClicked(listener: (item: ContentSummaryAndCompareStatus) => void) {
        this.itemClickListeners.push(listener);
    }

    unItemClicked(listener: (item: ContentSummaryAndCompareStatus) => void) {
        this.itemClickListeners = this.itemClickListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    protected notifyItemClicked(item: ContentSummaryAndCompareStatus) {
        this.itemClickListeners.forEach(listener => {
            listener(item);
        });
    }

    private static invalidAndReadOnlyOnTop(a: ContentSummaryAndCompareStatus, b: ContentSummaryAndCompareStatus): number {
        return DialogDependantList.readOnlyToNumber(b) - DialogDependantList.readOnlyToNumber(a) +
               DialogDependantList.validityToNumber(a) - DialogDependantList.validityToNumber(b);
    }

    private static readOnlyToNumber(a: ContentSummaryAndCompareStatus): number {
        return +(a.isReadOnly() === true);
    }

    private static validityToNumber(a: ContentSummaryAndCompareStatus): number {
        return +(a.getContentSummary().isValid() === true);
    }
}
