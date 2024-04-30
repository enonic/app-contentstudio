import {RequestError} from '@enonic/lib-admin-ui/rest/RequestError';
import {NamedPanel} from './NamedPanel';
import {LiveEditModel} from '../../../../../page-editor/LiveEditModel';

export abstract class BaseInspectionPanel
    extends NamedPanel {

    protected liveEditModel: LiveEditModel;

    protected constructor() {
        super('inspection-panel');
    }

    setModel(liveEditModel: LiveEditModel): void {
        this.liveEditModel = liveEditModel;
    }

    isNotFoundError(reason): boolean {
        return reason instanceof RequestError && (reason).isNotFound();
    }
}
