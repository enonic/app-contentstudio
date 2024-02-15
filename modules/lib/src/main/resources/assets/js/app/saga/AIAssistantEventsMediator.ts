import {EnonicAiStartEvent} from './event/incoming/EnonicAiStartEvent';
import {EnonicAiDataSentEvent} from './event/outgoing/EnonicAiDataSentEvent';
import {Content} from '../content/Content';
import {ContentType} from '../inputtype/schema/ContentType';
import {DataChangedEvent} from './event/internal/DataChangedEvent';
import {EnonicAiStopEvent} from './event/incoming/EnonicAiStopEvent';

// Serves as middleman between AI Assistant events and Studio events
export class AIAssistantEventsMediator {

    private static instance: AIAssistantEventsMediator;

    private content: Content;

    private contentType: ContentType;

    private startAssistantEventListener: (event: EnonicAiStartEvent) => void;

    private stopAssistantEventListener: (event: EnonicAiStopEvent) => void;

    private dataChangedEventListener: (event: DataChangedEvent) => void;

    private constructor() {
        this.initElements();
        this.initListeners();
    }

    static get(): AIAssistantEventsMediator {
        if (!AIAssistantEventsMediator.instance) {
            AIAssistantEventsMediator.instance = new AIAssistantEventsMediator();
        }

        return AIAssistantEventsMediator.instance;
    }

    private start(): void {
        DataChangedEvent.on(this.dataChangedEventListener);
    }

    private stop(): void {
        DataChangedEvent.un(this.dataChangedEventListener);
    }

    setContentContext(content: Content): this {
        this.content = content;
        return this;
    }

    setContentTypeContext(contentType: ContentType): this {
        this.contentType = contentType;
        return this;
    }

    private initElements(): void {
        this.startAssistantEventListener = (event: EnonicAiStartEvent) => {
            this.start();
            new EnonicAiDataSentEvent(this.content.getContentData().toJson(), this.contentType.getForm().toJson()).fire();
        };

        this.stopAssistantEventListener = (event: EnonicAiStopEvent) => {
            this.stop();
        };

        this.dataChangedEventListener = (event: DataChangedEvent) => {
            new EnonicAiDataSentEvent(event.getData(), this.contentType.getForm().toJson()).fire();
        };
    }

    private initListeners(): void {
        EnonicAiStartEvent.on(this.startAssistantEventListener);
        EnonicAiStopEvent.on(this.stopAssistantEventListener);
    }
}
