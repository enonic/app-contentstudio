import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ContentQuery} from '../../../../../app/content/ContentQuery';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {getItemById} from '../../../store/contentTreeData.store';
import {reload} from '../../../store/contentTreeLoadingStore';
import {$contentTreeSelection} from '../../../store/contentTreeSelectionStore';
import {ContentDataFetcher} from './ContentDataFetcher';
import {ContentTreeList, ContentTreeListProps} from './ContentTreeList';


export class ContentTreeListElement extends LegacyElement<typeof ContentTreeList, ContentTreeListProps> {

    private fetcher: ContentDataFetcher;
    private selectionChangedListeners: ((selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void)[] = [];

    constructor() {
        const fetcher = new ContentDataFetcher();

        super({
            fetcher,
        }, ContentTreeList);

        this.fetcher = fetcher;

        this.initListeners();
    }

    private initListeners(): void {
        const unsubscribeSelection = $contentTreeSelection.listen((newSelection, oldSelection) => {
            this.notifySelectionChanged(this.getSelectionChange(newSelection, oldSelection));
        });

        this.onRemoved(() => {
            unsubscribeSelection();
        });
    }

    onSelectionChanged(listener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    unSelectionChanged(listener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void): void {
        this.selectionChangedListeners = this.selectionChangedListeners
            .filter((currentListener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void) => currentListener !== listener);
    }

    protected notifySelectionChanged(selectionChange: SelectionChange<ContentSummaryAndCompareStatus>): void {
        this.selectionChangedListeners.forEach((listener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void) => listener(selectionChange));
    }

    private getSelectionChange(newSelection: ReadonlySet<string>, oldSelection: ReadonlySet<string>): SelectionChange<ContentSummaryAndCompareStatus> {
        const selected: ContentSummaryAndCompareStatus[] = [];

        newSelection.forEach((item) => {
            if (!oldSelection.has(item)) {
                const itemToSelect = getItemById(item);
                if (itemToSelect) {
                    selected.push(itemToSelect.item);
                }
            }
        });

        const deselected: ContentSummaryAndCompareStatus[] = [];

        oldSelection.forEach((item) => {
            if (!newSelection.has(item)) {
                const itemToDeselect = getItemById(item);
                if (itemToDeselect) {
                    deselected.push(itemToDeselect.item);
                }
            }
        });

        return {
            selected,
            deselected,
        }
    }

    setFilterQuery(filterQuery: ContentQuery | null): void {
        this.fetcher.setFilterQuery(filterQuery);
        reload();
    }
}
