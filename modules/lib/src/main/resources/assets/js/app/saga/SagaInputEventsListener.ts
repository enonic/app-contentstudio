import {ContentSummary} from '../content/ContentSummary';

export class SagaInputEventsListener {

    private static instance: SagaInputEventsListener;

    private content: ContentSummary;

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
    }

    stop(): void {
    }

    setContentContext(content: ContentSummary): void {
        this.content = content;
    }

    private initElements(): void {
 //
    }
}
