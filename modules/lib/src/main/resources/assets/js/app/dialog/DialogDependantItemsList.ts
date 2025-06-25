import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {StatusCheckableItem} from './StatusCheckableItem';
import {ContentItem} from '../../v6/features/shared/items/ContentItem';
import {cn} from '@enonic/ui';

export enum SelectionType {
    ALL = 'all',
    NONE = 'none',
    PARTIAL = 'partial',
}

export interface ExclusionUpdateEvent {
    manual: boolean;
    added: ContentId[];
    removed: ContentId[];
}

export type ItemClickListener = (item: ContentSummaryAndCompareStatus) => void;

export type SelectionChangeListener = (original: boolean) => void;

export type ExclusionUpdateListener = (event: ExclusionUpdateEvent) => void;

export type SelectionTypeChangeListener = (type: SelectionType) => void;

export interface ObserverConfig {
    sort?: boolean | ((items: ContentSummaryAndCompareStatus[]) => ContentSummaryAndCompareStatus[]);
    lazyLoadHandler?: () => void;
    scrollElement?: Element;
}

export interface DialogDependantItemsListConfig<View extends Element> {
    className?: string;
    createViewer?: () => ContentSummaryAndCompareStatusViewer,
    createItem?: (viewer: ContentSummaryAndCompareStatusViewer, item: ContentSummaryAndCompareStatus) => View,
    observer?: ObserverConfig;
    emptyText?: string;
}

const calcIdsDiff = (idsA: ContentId[], idsB: ContentId[]): ContentId[] => idsA.filter(idA => idsB.every(idB => !idB.equals(idA)));
const hasIdsDiff = (idsA: ContentId[], idsB: ContentId[]): boolean => idsA.some(idA => idsB.every(idB => !idB.equals(idA)));

const readOnlyToNumber = (content: ContentSummaryAndCompareStatus): number => Number(content.isReadOnly() === true);
const validityToNumber = (content: ContentSummaryAndCompareStatus): number => Number(content.getContentSummary().isValid() === true);

export function compareItems(a: ContentSummaryAndCompareStatus, b: ContentSummaryAndCompareStatus): number {
    return readOnlyToNumber(b) - readOnlyToNumber(a) + validityToNumber(a) - validityToNumber(b);
}

export class DialogDependantItemsList<View extends StatusCheckableItem | ContentItem = StatusCheckableItem>
    extends LazyListBox<ContentSummaryAndCompareStatus> {

    protected config: DialogDependantItemsListConfig<View>;

    private itemClickListeners: ItemClickListener[];

    private selectionChangeListeners: SelectionChangeListener[];

    private exclusionUpdateListeners: ExclusionUpdateListener[];

    private selectionTypeChangeListeners: SelectionTypeChangeListener[];

    protected excludedIds: ContentId[];

    protected selectionType: SelectionType;

    protected excludedHidden: boolean;

    constructor(config: DialogDependantItemsListConfig<View> = {}) {
        super(cn('grid gap-y-[5px] mt-3.5', config.className));

        this.config = config;
        this.itemClickListeners = [];
        this.selectionChangeListeners = [];
        this.exclusionUpdateListeners = [];
        this.selectionTypeChangeListeners = [];
        this.excludedIds = [];
        this.selectionType = SelectionType.ALL;
        this.excludedHidden = false;

        this.setEmptyText(config.emptyText);

        this.initListeners();
    }

    createItemView(item: ContentSummaryAndCompareStatus, readOnly: boolean): Element {
        const viewer = this.config.createViewer?.() ?? new ContentSummaryAndCompareStatusViewer();
        viewer.setObject(item);
        viewer.onClicked((event) => {
            const el = new ElementHelper(event.target as HTMLElement);
            if (!(el.hasClass('checkbox'))) {
                this.notifyItemClicked(item);
            }
        });

        const statusItem = this.config.createItem?.(viewer, item) ?? new StatusCheckableItem({viewer, item});
        statusItem.onSelected(() => this.handleSelectionChange());

        return statusItem;
    }

    getItemId(item: ContentSummaryAndCompareStatus): string {
        return item.getContentId().toString();
    }

    getItemsIds(): ContentId[] {
        return this.getItems().map(item => item.getContentId());
    }

    getItems(): ContentSummaryAndCompareStatus[] {
        return super.getItems();
    }

    addItems(items: ContentSummaryAndCompareStatus[], silent?: boolean): void {
        super.addItems(items, silent);

        this.updateSelectionType();
    }

    setItems(items: ContentSummaryAndCompareStatus[], silent?: boolean): void {
        this.selectionType = SelectionType.ALL;

        const {observer} = this.config;
        if (typeof observer?.sort === 'function') {
            super.setItems(observer.sort(items));
        } else if (observer?.sort !== false) {
            super.setItems([...items].sort(compareItems));
        } else {
            super.setItems(items, silent);
        }

        this.updateSelectionType();
    }

    getItemView(item: ContentSummaryAndCompareStatus): View {
        return super.getItemView(item) as View;
    }

    getItemViews(): View[] {
        return super.getItemViews() as View[];
    }

    setExcludedHidden(excludedHidden: boolean): void {
        this.excludedHidden = excludedHidden;
    }

    hasExcluded(): boolean {
        return this.excludedIds.length > 0;
    }

    getExcludedIds(): ContentId[] {
        return this.excludedIds;
    }

    addExcludedIds(ids: ContentId[]): ContentId[] {
        const added = calcIdsDiff(ids, this.excludedIds);
        this.excludedIds = [...this.excludedIds, ...added];
        this.notifyExclusionUpdated({manual: true, added, removed: []});
        return this.excludedIds;
    }

    setExcludedIds(ids: ContentId[]): ContentId[] {
        const added = calcIdsDiff(ids, this.excludedIds);
        const removed = calcIdsDiff(this.excludedIds, ids);
        this.excludedIds = ids;
        this.notifyExclusionUpdated({manual: true, added, removed});
        return this.excludedIds;
    }

    saveExclusions(): void {
        const newExcludedIds = this.getItemViews().filter(view => !view.isSelected()).map(view => view.getItem().getContentId());
        const loadedOldExcludedIds = this.excludedHidden ? [] : this.excludedIds.filter(
            id => this.getItemViews().some(view => view.getItem().getContentId().equals(id)));
        const added = calcIdsDiff(newExcludedIds, this.excludedIds);
        const removed = calcIdsDiff(loadedOldExcludedIds, newExcludedIds);

        const hasExclusionChanges = added.length > 0 || removed.length > 0;
        if (!hasExclusionChanges) {
            return;
        }

        this.excludedIds = [...calcIdsDiff(this.excludedIds, removed), ...added];

        this.notifyExclusionUpdated({manual: false, added, removed});
    }

    restoreExclusions(): void {
        const excludedIds = this.excludedIds.map(id => id.toString());
        this.getItemViews().forEach(view => {
            const wasSelected = excludedIds.indexOf(this.getItemId(view.getItem())) < 0;
            view.setSelected(wasSelected);
        });
    }

    getSelectionType(): SelectionType {
        return this.selectionType;
    }

    toggleSelectAll(select: boolean): void {
        let isSelectionChanged = false;

        this.getItemViews().forEach(view => {
            if (view.isSelected() !== select) {
                view.setSelected(select, false, true);
                isSelectionChanged = true;
            }
        });

        if (isSelectionChanged) {
            this.handleSelectionChange();
        }
    }

    onItemClicked(listener: ItemClickListener) {
        this.itemClickListeners.push(listener);
    }

    unItemClicked(listener: ItemClickListener) {
        this.itemClickListeners = this.itemClickListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onSelectionChanged(listener: SelectionChangeListener) {
        this.selectionChangeListeners.push(listener);
    }

    unSelectionChanged(listener: SelectionChangeListener) {
        this.selectionChangeListeners = this.selectionChangeListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onExclusionUpdated(listener: ExclusionUpdateListener) {
        this.exclusionUpdateListeners.push(listener);
    }

    unExclusionUpdated(listener: ExclusionUpdateListener) {
        this.exclusionUpdateListeners = this.exclusionUpdateListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onSelectionTypeChanged(listener: SelectionTypeChangeListener) {
        this.selectionTypeChangeListeners.push(listener);
    }

    unSelectionTypeChanged(listener: SelectionTypeChangeListener) {
        this.selectionTypeChangeListeners = this.selectionTypeChangeListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    reset(): void {
        this.excludedIds = [];
        this.selectionType = SelectionType.ALL;
        this.setItems([]);
    }

    protected initListeners(): void {
        //
    }

    protected updateSelectionType(): void {
        this.selectionType = this.calcSelectionType();
        this.notifySelectionTypeChanged(this.selectionType);
    }

    private calcSelectionType(): SelectionType {
        const selectableViews = this.getItemViews().filter(view => view.isSelectable());

        const totalCount = selectableViews.length;
        const selectedCount = selectableViews.filter(view => view.isSelected()).length;

        if (totalCount === selectedCount) {
            return SelectionType.ALL;
        }
        if (selectedCount === 0) {
            return SelectionType.NONE;
        }
        return SelectionType.PARTIAL;
    }

    protected mustSelectItem(item: ContentSummaryAndCompareStatus): boolean {
        return !this.isItemExcludable(item) ||
               !(this.selectionType === SelectionType.NONE || this.excludedIds.some(id => id.equals(item.getContentId())));
    }

    protected isItemExcludable(item: ContentSummaryAndCompareStatus): boolean {
        return true;
    }

    hasExcludableItems(): boolean {
        return this.getItems().some(item => this.isItemExcludable(item));
    }

    protected handleSelectionChange(): void {
        const newExcludedIds = this.getItemViews().filter(view => !view.isSelected()).map(view => view.getItem().getContentId());
        const loadedOldExcludedIds = this.excludedIds.filter(
            id => this.getItemViews().some(view => view.getItem().getContentId().equals(id)));

        const hasExclusionChanges = hasIdsDiff(newExcludedIds, this.excludedIds) || hasIdsDiff(loadedOldExcludedIds, newExcludedIds);

        this.updateSelectionType();
        this.notifySelectionChanged(!hasExclusionChanges);
    }

    protected getScrollContainer(): Element {
        return this.config.observer?.scrollElement ?? super.getScrollContainer();
    }

    protected handleLazyLoad(): void {
        this.config.observer?.lazyLoadHandler?.();
    }

    protected notifyItemClicked(item: ContentSummaryAndCompareStatus): void {
        this.itemClickListeners.forEach(listener => listener(item));
    }

    protected notifySelectionChanged(original: boolean): void {
        this.selectionChangeListeners.forEach(listener => listener(original));
    }

    protected notifyExclusionUpdated(event: ExclusionUpdateEvent): void {
        this.exclusionUpdateListeners.forEach(listener => listener(event));
    }

    protected notifySelectionTypeChanged(type: SelectionType): void {
        this.selectionTypeChangeListeners.forEach(listener => listener(type));
    }
}
