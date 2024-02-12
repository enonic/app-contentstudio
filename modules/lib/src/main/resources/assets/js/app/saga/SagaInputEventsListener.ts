import {InputInteractionEvent} from '@enonic/lib-admin-ui/form/InputInteractionEvent';
import {ContentSummary} from '../content/ContentSummary';

export class SagaInputEventsListener {

    private static instance: SagaInputEventsListener;

    private content: ContentSummary;

    private inputInteractionEventListener: (event: InputInteractionEvent) => void;

    private constructor() {
        this.initElements();
    }

    static get(): SagaInputEventsListener {
        if (!SagaInputEventsListener.instance) {
            SagaInputEventsListener.instance = new SagaInputEventsListener();
        }

        return SagaInputEventsListener.instance;
    }

    start(): void {
        InputInteractionEvent.on(this.inputInteractionEventListener);
    }

    stop(): void {
        InputInteractionEvent.un(this.inputInteractionEventListener);
    }

    setContentContext(content: ContentSummary): void {
        this.content = content;
    }

    private initElements(): void {
        this.inputInteractionEventListener = (event: InputInteractionEvent) => {
            console.log(event);
        };
    }
}
