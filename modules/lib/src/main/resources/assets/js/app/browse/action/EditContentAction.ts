import {ContentTreeGrid} from '../ContentTreeGrid';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {ProjectContext} from '../../project/ProjectContext';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentsLocalizer} from './ContentsLocalizer';
import {TreeListBox} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class EditContentAction extends ContentTreeGridAction {

    private static MAX_ITEMS_TO_EDIT: number = 50;

    private isLocalize: boolean = false;

    private contentsLocalizer?: ContentsLocalizer;

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, i18n('action.edit'), 'mod+e');
        this.setEnabled(false);
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedItems();

        if (contents.length > EditContentAction.MAX_ITEMS_TO_EDIT) {
            showWarning(i18n('notify.edit.tooMuch'));
        } else if (contents.length > 0) {
            if (this.isLocalize) {
                this.localizeContents(contents);
            } else {
                new EditContentEvent(contents).fire();
            }
        }
    }

    private localizeContents(contents: ContentSummaryAndCompareStatus[]): void {
        if (!this.contentsLocalizer) {
            this.contentsLocalizer = new ContentsLocalizer();
        }

        this.contentsLocalizer.localizeAndEdit(contents).catch(DefaultErrorHandler.handle);
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && state.hasAnyEditable();
    }

    updateLabel(state: ContentTreeGridItemsState) {
        this.isLocalize = state.hasAllInherited();
        this.setLabel(this.getLabelByState(state));
    }

    private getLabelByState(state: ContentTreeGridItemsState): string {
        if (state.hasAllReadOnly()) {
            return i18n('action.open');
        } else if (this.isLocalize) {
            return i18n('action.translate');
        }

        return i18n('action.edit');
    }

    resetLabel() {
        this.setLabel(i18n('action.edit'));
    }
}
