import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {ContentTreeListElement} from '../../../v6/features/views/browse/grid/ContentTreeListElement';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentLocalizer} from './ContentLocalizer';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class EditContentAction
    extends ContentTreeGridAction {

    private static MAX_ITEMS_TO_EDIT: number = 50;

    private isLocalize: boolean = false;

    private contentLocalizer?: ContentLocalizer;

    constructor(grid: ContentTreeListElement) {
        super(grid, i18n('action.edit'), 'mod+e');

        this.setEnabled(false).setClass('edit');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = getSelectedItems();

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
        if (!this.contentLocalizer) {
            this.contentLocalizer = new ContentLocalizer();
        }

        this.contentLocalizer.localizeAndEdit(contents).catch(DefaultErrorHandler.handle);
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
