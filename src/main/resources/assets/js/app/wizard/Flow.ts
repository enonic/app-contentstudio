import {Content} from '../content/Content';

export class RoutineContext {

    content: Content = null;

    dataUpdated: boolean = false;

    pageUpdated: boolean = false;
}

export class Flow {

    private thisOfProducer: any;

    constructor(thisOfProducer: any) {
        this.thisOfProducer = thisOfProducer;
    }

    getThisOfProducer(): any {
        return this.thisOfProducer;
    }

    public doExecute(context: RoutineContext): Q.Promise<RoutineContext> {
        return this.doExecuteNext(context);
    }

    doExecuteNext(_context: RoutineContext): Q.Promise<RoutineContext> {
        throw new Error('Must be implemented by inheritor');
    }
}
