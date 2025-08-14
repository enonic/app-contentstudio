import Q from 'q';
import {ContentWizardPanel} from './ContentWizardPanel';
import {CreateContentRequest} from '../resource/CreateContentRequest';
import {Flow, RoutineContext} from './Flow';
import {Content} from '../content/Content';

export class PersistNewContentRoutine
    extends Flow {

    private createContentRequestProducer: () => Q.Promise<CreateContentRequest | null>;

    private doneHandledContent: boolean = false;

    constructor(thisOfProducer: ContentWizardPanel) {
        super(thisOfProducer);
    }

    public setCreateContentRequestProducer(producer: () => Q.Promise<CreateContentRequest | null>): PersistNewContentRoutine {
        this.createContentRequestProducer = producer;
        return this;
    }

    public execute(): Q.Promise<RoutineContext> {

        let context = new RoutineContext();
        return this.doExecute(context);
    }

    doExecuteNext(context: RoutineContext): Q.Promise<RoutineContext> {

        if (!this.doneHandledContent) {

            return this.doHandleCreateContent(context).then(() => {

                this.doneHandledContent = true;
                return this.doExecuteNext(context);

            });
        } else {
            return Q(context);
        }
    }

    private doHandleCreateContent(context: RoutineContext | null): Q.Promise<void> {

        if (this.createContentRequestProducer != null) {

            return this.createContentRequestProducer.call(this.getThisOfProducer()).then((createContentRequest: CreateContentRequest) => {

                return createContentRequest.sendAndParse().then((content: Content): void => {

                    context.content = content;

                });
            });
        }

        return Q();
    }
}
