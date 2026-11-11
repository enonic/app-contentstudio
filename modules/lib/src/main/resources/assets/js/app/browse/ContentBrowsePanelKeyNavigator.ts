import { SelectableTreeListBoxKeyNavigator } from '@enonic/lib-admin-ui/ui/selector/list/SelectableTreeListBoxKeyNavigator';
import { type ContentSummaryAndCompareStatus } from '../content/ContentSummaryAndCompareStatus';
import { KeyBinding } from '@enonic/lib-admin-ui/ui/KeyBinding';
import { executeBrowseAction } from '../../v6/pages/browse/model/browseActions.commands';

export class ContentBrowsePanelKeyNavigator extends SelectableTreeListBoxKeyNavigator<ContentSummaryAndCompareStatus> {
    protected createKeyBindings(): KeyBinding[] {
        const keyBindings = super.createKeyBindings();

        keyBindings.push(
            new KeyBinding('enter', () => {
                executeBrowseAction('edit');
            }),
        );

        return keyBindings;
    }
}
