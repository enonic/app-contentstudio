import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ContentQuery} from '../../../../../app/content/ContentQuery';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {activateFilter, deactivateFilter, getFilterQuery} from '../../../api/content-fetcher';
import {$isFilterActive} from '../../../store/active-tree.store';
import {getContent} from '../../../store/content.store';
import {$currentIds} from '../../../store/contentTreeSelection.store';
import {$filterRefreshNeeded, clearFilterRefreshNeeded} from '../../../store/filter-tree.store';
import {ContentTreeContextMenuProps} from './ContentTreeContextMenu';
import {ContentTreeList, ContentTreeListProps} from './ContentTreeList';

export class ContentTreeListElement extends LegacyElement<typeof ContentTreeList, ContentTreeListProps> {
    private selectionChangedListeners: ((selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void)[] =
        [];

    constructor() {
        super({}, ContentTreeList);

        this.initListeners();
    }

    private initListeners(): void {
        // Subscribe to selection changes
        const unsubscribeCurrentIds = $currentIds.listen((currentIds, previousIds) => {
            this.notifySelectionChanged(this.getSelectionChange(new Set(currentIds), new Set(previousIds)));
        });

        // Subscribe to filter refresh signal (content created/duplicated while filtering)
        const unsubscribeFilterRefresh = $filterRefreshNeeded.subscribe((timestamp) => {
            if (timestamp === 0) return; // Signal cleared, ignore

            // Only refresh if filter mode is active
            if (!$isFilterActive.get()) return;

            const currentQuery = getFilterQuery();
            if (currentQuery) {
                clearFilterRefreshNeeded();
                activateFilter(currentQuery);
            }
        });

        this.onRemoved(() => {
            unsubscribeCurrentIds();
            unsubscribeFilterRefresh();
        });
    }

    onSelectionChanged(listener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    protected notifySelectionChanged(selectionChange: SelectionChange<ContentSummaryAndCompareStatus>): void {
        this.selectionChangedListeners.forEach(
            (listener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void) =>
                listener(selectionChange)
        );
    }

    private getSelectionChange(
        newSelection: ReadonlySet<string>,
        oldSelection: ReadonlySet<string>
    ): SelectionChange<ContentSummaryAndCompareStatus> {
        const selected: ContentSummaryAndCompareStatus[] = [];

        newSelection.forEach((id) => {
            if (!oldSelection.has(id)) {
                const content = getContent(id);
                if (content) {
                    selected.push(content);
                }
            }
        });

        const deselected: ContentSummaryAndCompareStatus[] = [];

        oldSelection.forEach((id) => {
            if (!newSelection.has(id)) {
                const content = getContent(id);
                if (content) {
                    deselected.push(content);
                }
            }
        });

        return {
            selected,
            deselected,
        };
    }

    setFilterQuery(filterQuery: ContentQuery | null): void {
        if (filterQuery) {
            // Activate filter mode with the query
            activateFilter(filterQuery);
        } else {
            // Deactivate filter mode, return to main tree
            deactivateFilter();
        }
    }

    setContextMenuActions(actions: ContentTreeContextMenuProps['actions']): void {
        this.props.setKey('contextMenuActions', actions);
    }
}
