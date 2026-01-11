import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ContentQuery} from '../../../../../app/content/ContentQuery';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {
    setFilterQuery,
    fetchRootChildrenFiltered,
} from '../../../api/content-fetcher';
import {getContent, subscribeToContentEvents} from '../../../store/content.store';
import {resetTree} from '../../../store/tree-list.store';
import {$contentTreeSelection} from '../../../store/contentTreeSelectionStore';
import {ContentTreeList2, ContentTreeList2Props} from './ContentTreeList2';
import {ContentTreeContextMenuProps} from './ContentTreeContextMenu';

export class ContentTreeListElement2 extends LegacyElement<typeof ContentTreeList2, ContentTreeList2Props> {
    private selectionChangedListeners: ((selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void)[] =
        [];

    constructor() {
        super({}, ContentTreeList2);

        this.initListeners();
    }

    private initListeners(): void {
        // Subscribe to content socket events
        const unsubscribeContentEvents = subscribeToContentEvents();

        // Subscribe to selection changes
        const unsubscribeSelection = $contentTreeSelection.listen((newSelection, oldSelection) => {
            this.notifySelectionChanged(this.getSelectionChange(newSelection, oldSelection));
        });

        this.onRemoved(() => {
            unsubscribeSelection();
            unsubscribeContentEvents();
        });
    }

    onSelectionChanged(listener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    unSelectionChanged(listener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void): void {
        this.selectionChangedListeners = this.selectionChangedListeners.filter(
            (currentListener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void) =>
                currentListener !== listener
        );
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
        setFilterQuery(filterQuery);
        resetTree();
        fetchRootChildrenFiltered();
    }

    setContextMenuActions(actions: ContentTreeContextMenuProps['actions']): void {
        this.props.setKey('contextMenuActions', actions);
    }
}
