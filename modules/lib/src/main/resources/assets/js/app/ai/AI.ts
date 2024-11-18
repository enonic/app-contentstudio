import {AiHelper} from '@enonic/lib-admin-ui/ai/AiHelper';
import {AiHelperState} from '@enonic/lib-admin-ui/ai/AiHelperState';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Content} from '../content/Content';
import {ContentType} from '../inputtype/schema/ContentType';
import {GetLocalesRequest} from '../resource/GetLocalesRequest';
import {ContentData, ContentLanguage, ContentSchema} from './event/data/AiData';
import {EnonicAiAppliedData} from './event/data/EnonicAiAppliedData';
import {EnonicAiContentOperatorSetupData} from './event/data/EnonicAiContentOperatorSetupData';
import {EnonicAiTranslatorSetupData} from './event/data/EnonicAiTranslatorSetupData';
import {AiContentOperatorResultAppliedEvent} from './event/incoming/AiContentOperatorResultAppliedEvent';
import {AiTranslatorCompletedEvent} from './event/incoming/AiTranslatorCompletedEvent';
import {AiTranslatorStartedEvent} from './event/incoming/AiTranslatorStartedEvent';
import {AiContentOperatorConfigureEvent} from './event/outgoing/AiContentOperatorConfigureEvent';
import {AiTranslatorConfigureEvent} from './event/outgoing/AiTranslatorConfigureEvent';
import {AiUpdateDataEvent} from './event/outgoing/AiUpdateDataEvent';
import {ProjectContext} from '../project/ProjectContext';
import {XDataWizardStepForm} from '../wizard/XDataWizardStepForm';
import {AiTranslatorFailedEvent} from './event/incoming/AiTranslatorFailedEvent';

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
        render(buttonContainer: HTMLElement, dialogContainer: HTMLElement): void;
    };
    translator?: {
        setup(setupData: EnonicAiTranslatorSetupData): void;
        render(container: HTMLElement): void;
        translate(instructions?: string, language?: string): Promise<boolean>;
    }
}

type EnonicAiPlugin = keyof EnonicAi;

const PLUGIN_KEYS: Readonly<Record<EnonicAiPlugin, `com.enonic.app.ai.${string}`>> = {
    contentOperator: 'com.enonic.app.ai.contentoperator',
    translator: 'com.enonic.app.ai.translator',
};

export class AI {

    private static instance: AI;

    private static XDATA_PREFIX = '__xdata__';

    private currentData: ContentData | undefined;

    private content: Content;

    private contentType: ContentType;

    private locales: Locale[];

    private instructions: Record<EnonicAiPlugin, string | undefined>;

    private resultReceivedListeners: ((data: EnonicAiAppliedData) => void)[] = [];

    private readyListeners: (() => void)[] = [];

    private constructor() {
        const hasPlugins = Object.keys(window.Enonic?.AI ?? {}).length > 0;
        if (!hasPlugins) {
            return;
        }

        AiContentOperatorResultAppliedEvent.on(this.applyContentOperatorEventListener);
        AiTranslatorStartedEvent.on(this.translatorStartedEventListener);
        AiTranslatorCompletedEvent.on(this.translatorCompletedEventListener);
        AiTranslatorFailedEvent.on(this.translatorFailedEventListener);

        this.getContentOperator()?.setup({serviceUrl: CONFIG.getString('services.aiContentOperatorServiceUrl')});
        this.getTranslator()?.setup({
            restServiceUrl: CONFIG.getString('services.aiTranslatorRestServiceUrl'),
            wsServiceUrl: CONFIG.getString('services.aiTranslatorWsServiceUrl')
        });

        void new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            const currentUser = loginResult.getUser();
            const fullName = currentUser.getDisplayName();
            const names = fullName.split(' ').map(word => word.substring(0, 1));
            const shortName = (names.length >= 2 ? names.join('') : fullName).substring(0, 2).toUpperCase();
            const user = {fullName, shortName} as const;
            new AiContentOperatorConfigureEvent({user}).fire();
        }).catch(DefaultErrorHandler.handle);

        new GetLocalesRequest().sendAndParse().then((locales) => {
            this.setLocales(locales);
        }).catch(DefaultErrorHandler.handle);
    }

    static get(): AI {
        return AI.instance ?? (AI.instance = new AI());
    }

    setContent(content: Content): void {
        this.content = content;
        new AiUpdateDataEvent({
            data: this.createContentData(),
            language: this.createContentLanguage(),
        }).fire();
        this.checkAndNotifyReady();
    }

    setContentType(contentType: ContentType): void {
        this.contentType = contentType;
        new AiUpdateDataEvent({schema: this.createContentSchema()}).fire();
        this.checkAndNotifyReady();
    }

    setCurrentData(data: ContentData): void {
        this.currentData = data;
        new AiUpdateDataEvent({data: this.createContentData()}).fire();
    }

    setLocales(locales: Locale[]): void {
        this.locales = locales;
        new AiUpdateDataEvent({language: this.createContentLanguage()}).fire();
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

    renderContentOperator(buttonContainer: HTMLElement, dialogContainer: HTMLElement): void {
        this.getContentOperator()?.render(buttonContainer, dialogContainer);
    }

    renderTranslator(container: HTMLElement): void {
        this.getTranslator()?.render(container);
    }

    translate(language: string): Promise<boolean> {
        return this.getTranslator()?.translate(language) ?? Promise.resolve(false);
    }

    private translatorStartedEventListener = (event: AiTranslatorStartedEvent) => {
        const helper = this.isXDataPath(event.path) ? this.getAiHelperByXData(event.path) : AiHelper.getAiHelperByPath(event.path);
        helper?.setState(AiHelperState.PROCESSING);
    };

    private translatorCompletedEventListener = (event: AiTranslatorCompletedEvent) => {
        const helper = this.isXDataPath(event.path) ? this.getAiHelperByXData(event.path) : AiHelper.getAiHelperByPath(event.path);
        helper?.setValue(event.text);
        helper?.setState(AiHelperState.COMPLETED);
    };

    private translatorFailedEventListener = (event: AiTranslatorFailedEvent) => {
        const helper = this.isXDataPath(event.path) ? this.getAiHelperByXData(event.path) : AiHelper.getAiHelperByPath(event.path);
        helper?.setState(AiHelperState.FAILED, {text: event.text});
    };

    private createContentData(): ContentData | undefined {
        // TODO: Add structuredClone, when target upgraded to ES2022
        return this.currentData || (this.content && {
            contentId: this.content.getContentId().toString(),
            fields: this.content.getContentData().toJson(),
            topic: this.content.getDisplayName(),
            project: ProjectContext.get().getProject().getName(),
        });
    }

    private createContentLanguage(): ContentLanguage | undefined {
        if (!this.content) {
            return;
        }

        const tag = this.content.getLanguage();
        const locale = this.locales?.find(l => l.getTag() === tag);
        const name = locale ? locale.getDisplayName() : tag;

        return {tag, name};
    }

    private createContentSchema(): ContentSchema | undefined {
        return this.contentType && {
            form: this.contentType.getForm().toJson(),
            name: this.contentType.getDisplayName(),
        };
    }

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
        return this.content != null && this.contentType != null && this.instructions != null && this.locales != null;
    }

    private checkAndNotifyReady(): void {
        if (this.isReady()) {
            this.readyListeners.forEach(l => l());
            this.readyListeners = [];
        }
    }

    private isXDataPath(path: string): boolean {
        return path.startsWith(AI.XDATA_PREFIX);
    }

    private getAiHelperByXData(path: string): AiHelper | undefined {
        const pathParts = path.split('/');
        const appName = pathParts[1];
        const xDataName = pathParts[2];
        const key = `${appName.replace(/-/g, '.')}:${xDataName}`;
        const xDataStepForm = XDataWizardStepForm.getXDataWizardStepForm(key);
        const xDataPath = `/${pathParts.slice(3).join('/')}`;

        return xDataStepForm ? AiHelper.getAiHelpersByParent(xDataStepForm).find(aiHelper => aiHelper.getDataPath() === xDataPath) : undefined;
    }
}
