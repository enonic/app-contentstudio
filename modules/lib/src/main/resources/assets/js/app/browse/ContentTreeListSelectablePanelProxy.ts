import {SelectableListBoxPanel} from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import {type ListBoxToolbar} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import {type SelectableListBoxWrapper, SelectionMode} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {type DataChangedEvent} from '@enonic/lib-admin-ui/ui/treegrid/DataChangedEvent';
import {type SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import Q from 'q';
import {getContentAsCSCS} from '../../v6/features/store/content.store';
import {getCurrentItemsAsCSCS} from '../../v6/features/store/contentTreeSelection.store';
import {$treeState} from '../../v6/features/store/tree-list.store';
import {type ContentTreeListElement} from '../../v6/features/views/browse/grid/ContentTreeListElement';
import {TreeListToolbarElement} from '../../v6/features/views/browse/tree/TreeListToolbar';
import {type ContentSummary} from '../content/ContentSummary';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ContentTreeListSelectablePanelProxy extends SelectableListBoxPanel<ContentSummaryAndCompareStatus> {

    private readonly contentTreeList: ContentTreeListElement;

    private readonly toolbar: TreeListToolbarElement;

    constructor(listBoxWrapper: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>, contentTreeList: ContentTreeListElement,
                toolbar: ListBoxToolbar<ContentSummaryAndCompareStatus>) {
        super(listBoxWrapper, toolbar);

        this.contentTreeList = contentTreeList;
        this.toolbar = new TreeListToolbarElement();
    }

    onDataChanged(listener: (event: DataChangedEvent<ContentSummaryAndCompareStatus>) => void): void {
        this.listBoxWrapper.onDataChanged(listener);
    }

    onSelectionChanged(listener: (selectionChange: SelectionChange<ContentSummaryAndCompareStatus>) => void): void {
        this.contentTreeList.onSelectionChanged(listener as unknown as (selectionChange: SelectionChange<ContentSummary>) => void);
    }

    getSelectedItems(): ContentSummaryAndCompareStatus[] {
        return [...getCurrentItemsAsCSCS()];
    }

    getLastSelectedItem(): ContentSummaryAndCompareStatus | undefined {
        return this.getSelectedItems().at(-1);
    }

    getSelectionMode(): SelectionMode {
        return SelectionMode.SELECT;
    }

    doRender(): Q.Promise<boolean> {
        this.addClass('selectable-list-box-panel flex flex-col');

        this.appendChild(this.toolbar);
        this.appendChild(this.contentTreeList);

        return Q(true);
    }

    getItem(id: string): ContentSummaryAndCompareStatus | undefined {
        return getContentAsCSCS(id);
    }

    getWrapper(): SelectableListBoxWrapper<ContentSummaryAndCompareStatus> {
        return this.listBoxWrapper;
    }

    getToolbar(): ListBoxToolbar<ContentSummaryAndCompareStatus> {
        return this.listToolbar;
    }

    getTotalItems(): number {
        return $treeState.get().nodes.size;
    }
}
