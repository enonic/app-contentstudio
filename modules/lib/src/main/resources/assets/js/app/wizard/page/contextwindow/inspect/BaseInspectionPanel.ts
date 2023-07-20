import {RequestError} from '@enonic/lib-admin-ui/rest/RequestError';
import {NamedPanel} from './NamedPanel';

export abstract class BaseInspectionPanel
    extends NamedPanel {

    constructor() {
        super('inspection-panel');
    }

    isNotFoundError(reason): boolean {
        return reason instanceof RequestError && (reason).isNotFound();
    }
}
