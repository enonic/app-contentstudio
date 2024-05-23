import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Content} from '../content/Content';
import {ContentType} from '../inputtype/schema/ContentType';
import {EnonicAiAppliedData} from './event/data/EnonicAiAppliedData';
import {ContentData} from './event/data/EnonicAiAssistantData';
import {EnonicAIApplyEvent} from './event/incoming/EnonicAIApplyEvent';
import {EnonicAiStartEvent} from './event/incoming/EnonicAiStartEvent';
import {EnonicAiStopEvent} from './event/incoming/EnonicAiStopEvent';
import {EnonicAiConfigEvent} from './event/outgoing/EnonicAiConfigEvent';
import {EnonicAiDataSentEvent} from './event/outgoing/EnonicAiDataSentEvent';

// Serves as middleman between AI Assistant events and Studio events
export class AIAssistantEventsMediator {

    private static instance: AIAssistantEventsMediator;

    private isAssistantOn: boolean = false;

    private content: Content;

    private currentData: ContentData;

    private contentType: ContentType;

    private customPrompt: string;

    private resultReceivedListeners: ((data: EnonicAiAppliedData) => void)[] = [];

    private constructor() {
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

    setCustomPrompt(customPrompt: string): this {
        this.customPrompt = customPrompt;
        return this;
    }

    private startAssistantEventListener = (event: EnonicAiStartEvent) => {
        this.start();

        void new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            const currentUser = loginResult.getUser();
            const fullName = currentUser.getDisplayName();
            const names = fullName.split(' ').map(word => word.substring(0, 1));
            const shortName = (names.length >= 2 ? names.join('') : fullName).substring(0, 2).toUpperCase();

            new EnonicAiConfigEvent({
                user: {
                    fullName,
                    shortName,
                }
            }).fire();
        });

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
            customPrompt: this.customPrompt,
        }).fire();

        if (this.currentData) {
            this.fireDataChangedEvent();
        }
    };

    private stopAssistantEventListener = (_: EnonicAiStopEvent) => {
        this.stop();
    };

    private applyAssistantEventListener = (event: EnonicAIApplyEvent) => {
        console.log(event.result);

        const {topic} = event.result;
        const hasDisplayNameChanged = !StringHelper.isEmpty(topic) && topic !== this.content.getDisplayName();
        const displayName = hasDisplayNameChanged ? topic : undefined;

        const propertyTree = PropertyTree.fromJson(event.result.fields);

        this.notifyResultReceived({displayName, propertyTree});
    };

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

    onResultReceived(listener: (data: EnonicAiAppliedData) => void): void {
        this.resultReceivedListeners.push(listener);
    }

    unResultReceived(listener: (data: EnonicAiAppliedData) => void): void {
        this.resultReceivedListeners = this.resultReceivedListeners.filter(l => l !== listener);
    }

    notifyResultReceived(data: EnonicAiAppliedData): void {
        this.resultReceivedListeners.forEach(l => l(data));
    }
}
