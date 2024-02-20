import {EnonicAiStartEvent} from './event/incoming/EnonicAiStartEvent';
import {EnonicAiDataSentEvent} from './event/outgoing/EnonicAiDataSentEvent';
import {Content} from '../content/Content';
import {ContentType} from '../inputtype/schema/ContentType';
import {EnonicAiStopEvent} from './event/incoming/EnonicAiStopEvent';
import {ContentData} from './event/data/EnonicAiAssistantData';
import {EnonicAIApplyEvent} from './event/incoming/EnonicAIApplyEvent';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';

// Serves as middleman between AI Assistant events and Studio events
export class AIAssistantEventsMediator {

    private static instance: AIAssistantEventsMediator;

    private isAssistantOn: boolean = false;

    private content: Content;

    private currentData: ContentData;

    private contentType: ContentType;

    private startAssistantEventListener: (event: EnonicAiStartEvent) => void;

    private stopAssistantEventListener: (event: EnonicAiStopEvent) => void;

    private applyAssistantEventListener: (event: EnonicAIApplyEvent) => void;

    private resultReceivedListeners: ((result: PropertyTree) => void)[] = [];

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
        this.isAssistantOn = true;
    }

    private stop(): void {
        this.isAssistantOn = false;
    }

    setContentContext(content: Content): this {
        this.content = content;
        return this;
    }

    setContentTypeContext(contentType: ContentType): this {
        this.contentType = contentType;
        return this;
    }

    setCurrentData(data: ContentData): void {
        this.currentData = data;

        if (this.isAssistantOn) {
            this.fireDataChangedEvent();
        }
    }

    private initElements(): void {
        this.startAssistantEventListener = (event: EnonicAiStartEvent) => {
            this.start();

            new EnonicAiDataSentEvent({
                data: {
                    fields: this.content.getContentData().toJson(),
                    topic: this.content.getDisplayName(),
                    language: this.content.getLanguage(),
                },
                schema: {
                    form: this.contentType.getForm().toJson(),
                    name: this.contentType.getDisplayName()
                },
            }).fire();

            if (this.currentData) {
                this.fireDataChangedEvent();
            }
        };

        this.stopAssistantEventListener = (event: EnonicAiStopEvent) => {
            this.stop();
        };

        this.applyAssistantEventListener = (event: EnonicAIApplyEvent) => {
            console.log(event.result);

            const propertyTree = PropertyTree.fromJson(event.result.fields);
            this.notifyResultReceived(propertyTree);
        };
    }

    private fireDataChangedEvent(): void {
        new EnonicAiDataSentEvent({
            data: this.currentData,
        }).fire();
    }

    private initListeners(): void {
        EnonicAiStartEvent.on(this.startAssistantEventListener);
        EnonicAiStopEvent.on(this.stopAssistantEventListener);
        EnonicAIApplyEvent.on(this.applyAssistantEventListener);
    }

    onResultReceived(listener: (result: PropertyTree) => void): void {
        this.resultReceivedListeners.push(listener);
    }

    unResultReceived(listener: (result: PropertyTree) => void): void {
        this.resultReceivedListeners = this.resultReceivedListeners.filter(l => l !== listener);
    }

    notifyResultReceived(result: PropertyTree): void {
        this.resultReceivedListeners.forEach(l => l(result));
    }
}
