import {SelectableListBoxPanel} from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import {ListBoxToolbar} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import {SelectableListBoxWrapper, SelectionMode} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {DataChangedEvent} from '@enonic/lib-admin-ui/ui/treegrid/DataChangedEvent';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import Q from 'q';
import {$flatContentTreeItems} from '../../v6/features/store/contentTreeData.store';
import {getSelectedItems} from '../../v6/features/store/contentTreeSelectionStore';
import {ContentTreeListElement} from '../../v6/features/views/browse/grid/ContentTreeListElement';
import {TreeListToolbarElement} from '../../v6/features/views/browse/tree/TreeListToolbar';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

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
        this.contentTreeList.onSelectionChanged(listener);
    }

    getSelectedItems(): ContentSummaryAndCompareStatus[] {
        return getSelectedItems();
    }

    getLastSelectedItem(): ContentSummaryAndCompareStatus | undefined {
        return this.getSelectedItems().pop();
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

    getItem(id: string): ContentSummaryAndCompareStatus {
        return $flatContentTreeItems.get().find(data => data.id === id)?.item;
    }

    getWrapper(): SelectableListBoxWrapper<ContentSummaryAndCompareStatus> {
        return this.listBoxWrapper;
    }

    getToolbar(): ListBoxToolbar<ContentSummaryAndCompareStatus> {
        return this.listToolbar;
    }

    getTotalItems(): number {
        return $flatContentTreeItems.get().length;
    }
}
