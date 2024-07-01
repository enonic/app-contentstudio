import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Content} from '../content/Content';
import {ContentType} from '../inputtype/schema/ContentType';
import {EnonicAiAppliedData} from './event/data/EnonicAiAppliedData';
import {ContentData} from './event/data/EnonicAiAssistantData';
import {EnonicAiSetupData} from './event/data/EnonicAiSetupData';
import {EnonicAIApplyEvent} from './event/incoming/EnonicAIApplyEvent';
import {EnonicAiRenderEvent} from './event/incoming/EnonicAiRenderEvent';
import {EnonicAiShowEvent} from './event/incoming/EnonicAiShowEvent';
import {EnonicAiTranslationCompletedEvent} from './event/incoming/EnonicAiTranslationCompletedEvent';
import {EnonicAiTranslationStartedEvent} from './event/incoming/EnonicAiTranslationStartedEvent';
import {EnonicAiConfigEvent} from './event/outgoing/EnonicAiConfigEvent';
import {EnonicAiDataSentEvent} from './event/outgoing/EnonicAiDataSentEvent';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

interface AIAssistant {
    render(container: HTMLElement, setupData: EnonicAiSetupData): void;

    translator: {
        translate(): Promise<boolean>;
        isAvailable(): boolean;
    }
}

export class AI {

    private static instance: AI;

    private content: Content;

    private currentData: ContentData;

    private contentType: ContentType;

    private customPrompt: string;

    private resultReceivedListeners: ((data: EnonicAiAppliedData) => void)[] = [];

    private assistantReadyListeners: (() => void)[] = [];

    private constructor() {
        EnonicAiRenderEvent.on(this.showAssistantEventListener);
        EnonicAiShowEvent.on(this.showAssistantEventListener);
        EnonicAIApplyEvent.on(this.applyAssistantEventListener);
        EnonicAiTranslationStartedEvent.on(this.translationStatedAssistantEventListener);
        EnonicAiTranslationCompletedEvent.on(this.translationCompletedAssistantEventListener);
    }

    static get(): AI {
        return AI.instance ?? (AI.instance = new AI());
    }

    setContentContext(content: Content): void {
        this.content = content;
        this.checkIsReady();
    }

    setContentTypeContext(contentType: ContentType): void {
        this.contentType = contentType;
        this.checkIsReady();
    }

    setCurrentData(data: ContentData): void {
        this.currentData = data;
        this.fireDataChangedEvent();
    }

    setCustomPrompt(customPrompt: string): void {
        this.customPrompt = customPrompt;
    }

    private getAssistant(): AIAssistant | undefined {
        return window['Enonic_AI'] as AIAssistant | undefined;
    }

    isAvailable(): boolean {
        return this.getAssistant() != null;
    }

    renderAssistant(container: HTMLElement, setupData: EnonicAiSetupData): void {
        const assistant = this.getAssistant();
        if (assistant) {
            assistant.render(container, setupData);
        }
    }

    translate(): Promise<boolean> {
        const assistant = this.getAssistant();
        return assistant?.translator.translate() ?? Promise.resolve(false);
    }

    canTranslate(): boolean {
        const assistant = this.getAssistant();
        return assistant?.translator.isAvailable() ?? false;
    }

    private translationStatedAssistantEventListener = (event: EnonicAiTranslationStartedEvent) => {
        // TODO: Disable input, add animation
    };

    private translationCompletedAssistantEventListener = (event: EnonicAiTranslationCompletedEvent) => {
        // TODO: Apply value, enable field, and disable animation
    };

    private showAssistantEventListener = () => {
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

    onResultReceived(listener: (data: EnonicAiAppliedData) => void): void {
        this.resultReceivedListeners.push(listener);
    }

    private notifyResultReceived(data: EnonicAiAppliedData): void {
        this.resultReceivedListeners.forEach(l => l(data));
    }

    whenReady(callback: () => void): void {
        if (this.isReady()) {
            callback();
        } else {
            this.assistantReadyListeners.push(callback);
        }
    }

    isReady(): boolean {
        return ObjectHelper.isDefined(this.content) && ObjectHelper.isDefined(this.contentType);
    }

    private checkIsReady(): void {
        if (this.isReady()) {
            this.assistantReadyListeners.forEach(l => l());
            this.assistantReadyListeners = [];
        }
    }
}
