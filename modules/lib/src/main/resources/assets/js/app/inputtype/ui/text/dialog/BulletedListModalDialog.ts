import {ListStyleModalDialog} from './ListStyleModalDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class BulletedListModalDialog
    extends ListStyleModalDialog {

    protected createTypeValuesMap(): Map<string, string> {
        const map: Map<string,string> = new Map<string, string>();

        map.set('notset', this.getEditor().lang['liststyle']?.notset || 'Not Set');
        map.set('circle', this.getEditor().lang['liststyle']?.circle || 'Circle');
        map.set('disc', this.getEditor().lang['liststyle']?.disc || 'Disc');
        map.set('square', this.getEditor().lang['liststyle']?.square || 'Square');

        return map;
    }

    protected getTitle(): string {
        return i18n('dialog.list.bulleted.title');
    }
}
