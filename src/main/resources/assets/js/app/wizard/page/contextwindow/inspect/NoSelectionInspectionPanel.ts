import i18n = api.util.i18n;
import {NamedPanel} from './NamedPanel';

export class NoSelectionInspectionPanel
    extends NamedPanel {

    private header: api.app.NamesView;

    constructor() {
        super('inspection-panel');

        this.header = new api.app.NamesView().setMainName(i18n('field.inspection.empty'));

        this.appendChild(this.header);
    }

    getName(): string {
        return i18n('live.view.inspect');
    }
}
