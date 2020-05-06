import {i18n} from 'lib-admin-ui/util/Messages';
import {NamedPanel} from './NamedPanel';
import {NamesView} from 'lib-admin-ui/app/NamesView';

export class NoSelectionInspectionPanel
    extends NamedPanel {

    private header: NamesView;

    constructor() {
        super('inspection-panel');

        this.header = new NamesView().setMainName(i18n('field.inspection.empty'));

        this.appendChild(this.header);
    }

    getName(): string {
        return i18n('live.view.inspect');
    }
}
