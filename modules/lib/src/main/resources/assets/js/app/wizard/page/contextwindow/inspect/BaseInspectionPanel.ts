import {RequestError} from 'lib-admin-ui/rest/RequestError';
import {NamedPanel} from './NamedPanel';

export abstract class BaseInspectionPanel
    extends NamedPanel {

    constructor() {
        super('inspection-panel');
    }

    isNotFoundError(reason: any): boolean {
        return reason instanceof RequestError && (<RequestError>reason).isNotFound();
    }
}
