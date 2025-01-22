import {RequestError} from '@enonic/lib-admin-ui/rest/RequestError';
import {NamedPanel} from './NamedPanel';
import {LiveEditModel} from '../../../../../page-editor/LiveEditModel';

export abstract class BaseInspectionPanel
    extends NamedPanel {

    protected liveEditModel: LiveEditModel;

    private layoutListeners: ((panel: BaseInspectionPanel) => void)[] = [];

    protected constructor() {
        super('inspection-panel');
    }

    setModel(liveEditModel: LiveEditModel): void {
        this.liveEditModel = liveEditModel;
    }

    isNotFoundError(reason): boolean {
        return reason instanceof RequestError && (reason).isNotFound();
    }

    protected notifyLayoutListeners(): void {
        this.layoutListeners.forEach((listener) => listener(this));
    }

    onLayoutListener(listener: (panel: BaseInspectionPanel) => void): void {
        this.layoutListeners.push(listener);
    }

    unLayoutListener(listener: (panel: BaseInspectionPanel) => void): void {
        this.layoutListeners = this.layoutListeners.filter((l) => l !== listener);
    }
}
