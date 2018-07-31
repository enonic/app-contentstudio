export class RoutineContext {

    content: Content = null;
}

export class Flow<M extends Content> {

    private thisOfProducer: any;

    constructor(thisOfProducer: any) {
        this.thisOfProducer = thisOfProducer;
    }

    getThisOfProducer(): any {
        return this.thisOfProducer;
    }

    public doExecute(context: RoutineContext): wemQ.Promise<M> {
        return this.doExecuteNext(context);
    }

    doExecuteNext(_context: RoutineContext): wemQ.Promise<M> {
        throw new Error('Must be implemented by inheritor');
    }
}
