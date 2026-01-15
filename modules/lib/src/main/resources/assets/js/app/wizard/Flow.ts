import {Content} from '../content/Content';
import {ContentWizardPanel} from './ContentWizardPanel';

export class RoutineContext {

    content: Content = null;

    dataUpdated: boolean = false;

    pageUpdated: boolean = false;

    workflowUpdated: boolean = false;
}

export class Flow {

    private readonly thisOfProducer: ContentWizardPanel;

    constructor(thisOfProducer: ContentWizardPanel) {
        this.thisOfProducer = thisOfProducer;
    }

    getThisOfProducer(): ContentWizardPanel {
        return this.thisOfProducer;
    }

    public doExecute(context: RoutineContext): Q.Promise<RoutineContext> {
        return this.doExecuteNext(context);
    }

    doExecuteNext(_context: RoutineContext): Q.Promise<RoutineContext> {
        throw new Error('Must be implemented by inheritor');
    }
}
