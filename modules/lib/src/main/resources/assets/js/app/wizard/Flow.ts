import {type Content} from '../content/Content';

export class RoutineContext {

    content: Content = null;

    dataUpdated: boolean = false;

    pageUpdated: boolean = false;

    workflowUpdated: boolean = false;
}

export class Flow {

    public doExecute(context: RoutineContext): Q.Promise<RoutineContext> {
        return this.doExecuteNext(context);
    }

    doExecuteNext(_context: RoutineContext): Q.Promise<RoutineContext> {
        throw new Error('Must be implemented by inheritor');
    }
}
