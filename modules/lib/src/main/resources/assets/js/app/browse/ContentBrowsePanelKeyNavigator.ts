import {SelectableTreeListBoxKeyNavigator} from '@enonic/lib-admin-ui/ui/selector/list/SelectableTreeListBoxKeyNavigator';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentTreeActions} from './ContentTreeActions';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';

export class ContentBrowsePanelKeyNavigator
    extends SelectableTreeListBoxKeyNavigator<ContentSummaryAndCompareStatus> {

    private readonly treeActions: ContentTreeActions;

    constructor(selectableListBoxWrapper: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>, treeActions: ContentTreeActions) {
        super(selectableListBoxWrapper);

        this.treeActions = treeActions;
    }

    protected createKeyBindings(): KeyBinding[] {
        const keyBindings = super.createKeyBindings();

        keyBindings.push(new KeyBinding('enter', () => {
            this.treeActions.getEditAction().execute();
        }));

        return keyBindings;
    }
}
