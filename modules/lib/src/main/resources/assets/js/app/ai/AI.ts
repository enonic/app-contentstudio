import {AiHelper} from '@enonic/lib-admin-ui/ai/AiHelper';
import {AiHelperState} from '@enonic/lib-admin-ui/ai/AiHelperState';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Content} from '../content/Content';
import {ContentType} from '../inputtype/schema/ContentType';
import {EnonicAiAppliedData} from './event/data/EnonicAiAppliedData';
import {ContentData} from './event/data/EnonicAiContentData';
import {EnonicAiContentOperatorSetupData} from './event/data/EnonicAiContentOperatorSetupData';
import {EnonicAiTranslatorSetupData} from './event/data/EnonicAiTranslatorSetupData';
import {AiContentOperatorDialogShownEvent} from './event/incoming/AiContentOperatorDialogShownEvent';
import {AiContentOperatorRenderedEvent} from './event/incoming/AiContentOperatorRenderedEvent';
import {AiContentOperatorResultAppliedEvent} from './event/incoming/AiContentOperatorResultAppliedEvent';
import {AiTranslatorCompletedEvent} from './event/incoming/AiTranslatorCompletedEvent';
import {AiTranslatorStartedEvent} from './event/incoming/AiTranslatorStartedEvent';
import {AiContentOperatorConfigureEvent} from './event/outgoing/AiContentOperatorConfigureEvent';
import {AiTranslatorConfigureEvent} from './event/outgoing/AiTranslatorConfigureEvent';
import {AiUpdateDataEvent} from './event/outgoing/AiUpdateDataEvent';

declare global {
    interface Window {
        Enonic?: {
            AI?: EnonicAi;
        };
    }
}

interface EnonicAi {
    contentOperator?: {
        setup(setupData: EnonicAiContentOperatorSetupData): void;
        render(container: HTMLElement): void;
    };
    translator?: {
        setup(setupData: EnonicAiTranslatorSetupData): void;
        render(container: HTMLElement): void;
        translate(language?: string): Promise<boolean>;
        isAvailable(): boolean;
    }
}

type EnonicAiPlugin = keyof EnonicAi;

const PLUGIN_KEYS: Readonly<Record<EnonicAiPlugin, `com.enonic.app.ai.${string}`>> = {
    contentOperator: 'com.enonic.app.ai.contentoperator',
    translator: 'com.enonic.app.ai.translator',
};

export class AI {

    private static instance: AI;

    private content: Content;

    private currentData: ContentData | undefined;

    private contentType: ContentType;

    private instructions: Record<EnonicAiPlugin, string | undefined>;

    private resultReceivedListeners: ((data: EnonicAiAppliedData) => void)[] = [];

    private readyListeners: (() => void)[] = [];

    private constructor() {
        const hasPlugins = Object.keys(window.Enonic?.AI ?? {}).length > 0;
        if (!hasPlugins) {
            return;
        }

        AiContentOperatorRenderedEvent.on(this.showContentOperatorEventListener);
        AiContentOperatorDialogShownEvent.on(this.showContentOperatorEventListener);
        AiContentOperatorResultAppliedEvent.on(this.applyContentOperatorEventListener);
        AiTranslatorStartedEvent.on(this.translatorStartedEventListener);
        AiTranslatorCompletedEvent.on(this.translatorCompletedEventListener);

        this.getContentOperator()?.setup({serviceUrl: CONFIG.getString('services.aiContentOperatorServiceUrl')});
        this.getTranslator()?.setup({serviceUrl: CONFIG.getString('services.aiTranslatorServiceUrl')});

        void new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            const currentUser = loginResult.getUser();
            const fullName = currentUser.getDisplayName();
            const names = fullName.split(' ').map(word => word.substring(0, 1));
            const shortName = (names.length >= 2 ? names.join('') : fullName).substring(0, 2).toUpperCase();

            new AiContentOperatorConfigureEvent({
                user: {
                    fullName,
                    shortName,
                }
            }).fire();
        });
    }

    static get(): AI {
        return AI.instance ?? (AI.instance = new AI());
    }

    setContentContext(content: Content): void {
        this.content = content;
        this.checkAndNotifyReady();
    }

    setContentTypeContext(contentType: ContentType): void {
        this.contentType = contentType;
        this.checkAndNotifyReady();
    }

    setCurrentData(data: ContentData): void {
        this.currentData = data;
        new AiUpdateDataEvent({data}).fire();
    }

    updateInstructions(configs: ApplicationConfig[]): void {
        this.instructions = {
            contentOperator: undefined,
            translator: undefined,
        };

        Object.keys(PLUGIN_KEYS).forEach(plugin => {
            const appKey = PLUGIN_KEYS[plugin];
            const pluginSiteConfig = configs.find(config => config.getApplicationKey().getName() === appKey);
            if (pluginSiteConfig) {
                const instruction = pluginSiteConfig.getConfig()?.getString('instructions') ?? '';
                if (instruction !== this.instructions[plugin]) {
                    this.instructions[plugin] = instruction;
                    this.notifyInstructionsChanged(plugin as EnonicAiPlugin, instruction);

                }
            }
        });

        this.checkAndNotifyReady();
    }

    private notifyInstructionsChanged(plugin: EnonicAiPlugin, instructions: string): void {
        switch (plugin) {
        case 'contentOperator':
            new AiContentOperatorConfigureEvent({instructions}).fire();
            break;
        case 'translator':
            new AiTranslatorConfigureEvent({instructions}).fire();
            break;
        }
    }

    private getContentOperator(): EnonicAi['contentOperator'] | undefined {
        return window.Enonic?.AI?.contentOperator ?? undefined;
    }

    private getTranslator(): EnonicAi['translator'] | undefined {
        return window.Enonic?.AI?.translator ?? undefined;
    }

    has(plugin: EnonicAiPlugin): boolean {
        return window.Enonic?.AI?.[plugin] != null;
    }

    renderContentOperator(container: HTMLElement): void {
        this.getContentOperator()?.render(container);
    }

    translate(language: string): Promise<boolean> {
        return this.getTranslator()?.translate(language) ?? Promise.resolve(false);
    }

    canTranslate(): boolean {
        return this.getTranslator()?.isAvailable() ?? false;
    }

    private translatorStartedEventListener = (event: AiTranslatorStartedEvent) => {
        AiHelper.getAiHelperByPath(event.path)?.setState(AiHelperState.PROCESSING);
    };

    private translatorCompletedEventListener = (event: AiTranslatorCompletedEvent) => {
        const helper = AiHelper.getAiHelperByPath(event.path);
        helper?.setValue(event.value);
        helper?.setState(AiHelperState.COMPLETED);
    };

    private showContentOperatorEventListener = () => {
        new AiUpdateDataEvent({
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
            new AiUpdateDataEvent({data: this.currentData}).fire();
        }
    };

    private applyContentOperatorEventListener = (event: AiContentOperatorResultAppliedEvent) => {
        const {topic} = event.result;
        const hasDisplayNameChanged = !StringHelper.isEmpty(topic) && topic !== this.content.getDisplayName();
        const displayName = hasDisplayNameChanged ? topic : undefined;

        const propertyTree = PropertyTree.fromJson(event.result.fields);

        this.notifyResultReceived({displayName, propertyTree});
    };

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
            this.readyListeners.push(callback);
        }
    }

    private isReady(): boolean {
        return this.content != null && this.contentType != null && this.instructions != null;
    }

    private checkAndNotifyReady(): void {
        if (this.isReady()) {
            this.readyListeners.forEach(l => l());
            this.readyListeners = [];
        }
    }
}
