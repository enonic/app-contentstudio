import RequestError = api.rest.RequestError;
import {NamedPanel} from './NamedPanel';

export abstract class BaseInspectionPanel
    extends NamedPanel {

    constructor() {
        super('inspection-panel');

        this.onRendered(() => {
            wemjq(this.getHTMLElement()).slimScroll({
                height: '100%',
                size: '10px',
            });
        });
    }

    isNotFoundError(reason: any): boolean {
        return reason instanceof RequestError && (<RequestError>reason).isNotFound();
    }
}
