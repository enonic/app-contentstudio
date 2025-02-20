import {AiHelperState} from '@enonic/lib-admin-ui/ai/AiHelperState';
import {AiToolHelper} from '@enonic/lib-admin-ui/ai/tool/AiToolHelper';
import {RGBColor} from '@enonic/lib-admin-ui/ai/tool/ui/AiAnimationHandler';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {Content} from '../content/Content';
import {ContentRequiresSaveEvent} from '../event/ContentRequiresSaveEvent';
import {ContentType} from '../inputtype/schema/ContentType';
import {ComponentPath} from '../page/region/ComponentPath';
import {ProjectContext} from '../project/ProjectContext';
import {GetLocalesRequest} from '../resource/GetLocalesRequest';
import {ContentWizardHeader} from '../wizard/ContentWizardHeader';
import {PageEventsManager} from '../wizard/PageEventsManager';
import {AiContentDataHelper} from './AiContentDataHelper';
import {ContentData, ContentLanguage, ContentSchema} from './event/data/AiData';
import {EnonicAiContentOperatorSetupData} from './event/data/EnonicAiContentOperatorSetupData';
import {EnonicAiTranslatorSetupData} from './event/data/EnonicAiTranslatorSetupData';
import {AiContentOperatorContextChangedEvent} from './event/incoming/AiContentOperatorContextChangedEvent';
import {AiContentOperatorDialogHiddenEvent} from './event/incoming/AiContentOperatorDialogHiddenEvent';
import {AiContentOperatorDialogShownEvent} from './event/incoming/AiContentOperatorDialogShownEvent';
import {AiContentOperatorInteractionEvent} from './event/incoming/AiContentOperatorInteractionEvent';
import {AiContentOperatorResultAppliedEvent} from './event/incoming/AiContentOperatorResultAppliedEvent';
import {AiTranslatorAllCompletedEvent} from './event/incoming/AiTranslatorAllCompletedEvent';
import {AiTranslatorCompletedEvent} from './event/incoming/AiTranslatorCompletedEvent';
import {AiTranslatorStartedEvent} from './event/incoming/AiTranslatorStartedEvent';
import {AiContentOperatorConfigureEvent} from './event/outgoing/AiContentOperatorConfigureEvent';
import {AiTranslatorConfigureEvent} from './event/outgoing/AiTranslatorConfigureEvent';
import {AiUpdateDataEvent} from './event/outgoing/AiUpdateDataEvent';
import {CompareStatus} from '../content/CompareStatus';

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

    private aiContentDataHelper: AiContentDataHelper;

    private currentData: ContentData | undefined;

    private content: Content;

    private contentType: ContentType;

    private locales: Locale[];

    private instructions: Record<EnonicAiPlugin, string | undefined>;

    private readyListeners: (() => void)[] = [];

    private context?: string;

    private aiToolHelper: AiToolHelper;

    private constructor() {
        this.aiContentDataHelper = new AiContentDataHelper();
        this.aiToolHelper = AiToolHelper.get();

        const hasPlugins = Object.keys(window.Enonic?.AI ?? {}).length > 0;
        if (!hasPlugins) {
            return;
        }

        AiContentOperatorResultAppliedEvent.on(this.applyContentOperatorEventListener);
        AiTranslatorStartedEvent.on(this.translatorStartedEventListener);
        AiTranslatorCompletedEvent.on(this.translatorCompletedEventListener);
        AiTranslatorAllCompletedEvent.on(this.translateAllCompletedEventListener);
        AiContentOperatorContextChangedEvent.on(this.handleContextChangedEvent);
        AiContentOperatorDialogShownEvent.on(this.handleDialogOpenedEvent);
        AiContentOperatorDialogHiddenEvent.on(this.handleDialogClosedEvent);
        AiContentOperatorInteractionEvent.on(this.handleInteractionEvent);

        this.getContentOperator()?.setup({
            wsServiceUrl: CONFIG.getString('services.aiContentOperatorWsServiceUrl')
        });
        this.getTranslator()?.setup({
            restServiceUrl: CONFIG.getString('services.aiTranslatorRestServiceUrl'),
            wsServiceUrl: CONFIG.getString('services.aiTranslatorWsServiceUrl')
        });

        ProjectContext.get().whenInitialized(() => {
            new AiUpdateDataEvent({language: this.createContentLanguage()}).fire();

            const tag = ProjectContext.get().getProject().getLanguage();
            void new GetLocalesRequest().setSearchQuery(tag).sendAndParse().then((locales) => {
                this.setLocales(locales);
            }).catch(DefaultErrorHandler.handle);
        });

        void new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            const currentUser = loginResult.getUser();
            const fullName = currentUser.getDisplayName();
            const names = fullName.split(' ').map(word => word.substring(0, 1));
            const shortName = (names.length >= 2 ? names.join('') : fullName).substring(0, 2).toUpperCase();
            const user = {fullName, shortName} as const;
            new AiContentOperatorConfigureEvent({user}).fire();
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

    setDataTree(dataTree: PropertyTree): void {
        this.aiContentDataHelper.setDataTree(dataTree);
    }

    setContentHeader(contentHeader: ContentWizardHeader): void {
        this.aiContentDataHelper.setContentHeader(contentHeader);
    }

    setCompareStatus(compareStatus: CompareStatus): void {
        this.aiContentDataHelper.setCompareStatus(compareStatus);
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

    hasTranslator(): boolean {
        return this.has('translator');
    }

    hasContentOperator(): boolean {
        return this.has('contentOperator');
    }

    renderContentOperator(buttonContainer: HTMLElement, dialogContainer: HTMLElement): void {
        this.getContentOperator()?.render(buttonContainer, dialogContainer);
    }

    renderTranslator(container: HTMLElement): void {
        this.getTranslator()?.render(container);
    }

    private translatorStartedEventListener = (event: AiTranslatorStartedEvent) => {
        this.aiToolHelper.setState(this.aiContentDataHelper.transformPathOnDemand(event.path), AiHelperState.PROCESSING);

        if (this.aiContentDataHelper.isPageComponentPath(event.path)) {
            PageEventsManager.get().notifySetComponentState(
                ComponentPath.fromString(event.path.replace(AiContentDataHelper.PAGE_PREFIX, '')), true);
        }
    };

    private translatorCompletedEventListener = (event: AiTranslatorCompletedEvent) => {
        const state = event.success ? AiHelperState.COMPLETED : AiHelperState.FAILED;
        const text = !event.success ? event.message : event.text;
        const data = text ? {text} : undefined;
        this.aiToolHelper.setState(this.aiContentDataHelper.transformPathOnDemand(event.path), state, data);

        if (event.success) {
            this.aiContentDataHelper.setValue(event.path, event.text);
        }

        // Probably a text component event, and they don't have AI helpers
        if (this.aiContentDataHelper.isPageComponentPath(event.path)) {
            PageEventsManager.get().notifySetComponentState(
                ComponentPath.fromString(event.path.replace(AiContentDataHelper.PAGE_PREFIX, '')), false);
        }
    };

    private translateAllCompletedEventListener = (event: AiTranslatorAllCompletedEvent) => {
        if (event.success) {
            new ContentRequiresSaveEvent(this.content.getContentId()).fire();
        } else if (event.message) {
            NotifyManager.get().showError(event.message);
        }
    };

    private handleContextChangedEvent = (event: AiContentOperatorContextChangedEvent) => {
        this.context = event.context;
        this.aiToolHelper.setActiveContext(event.context);
    };

    private handleDialogOpenedEvent = () => {
        this.aiToolHelper.setActiveContext(this.context);
    }

    private handleDialogClosedEvent = () => {
        this.aiToolHelper.setActiveContext(null);
    }

    private handleInteractionEvent = (event: AiContentOperatorInteractionEvent) => {
        // operator works now only with data and sends path without __group__ prefix, adding it for compatibility
        const pathWithGroup = `${AiContentDataHelper.DATA_PREFIX}${event.path.startsWith('/') ? '' : '/'}${event.path}`;

        switch (event.interaction) {
        case 'click':
            this.handleClickInteractionEvent(pathWithGroup);
            break;
        }
    }

    private handleClickInteractionEvent = (path: string) => {
        this.aiToolHelper.animate(path, ['scroll', this.aiContentDataHelper.isTopicPath(path) ? 'innerGlow' : 'glow']);
    }

    private createContentData(): ContentData | undefined {
        // TODO: Add structuredClone, when target upgraded to ES2022
        return this.currentData || (this.content && {
            contentId: this.content.getContentId().toString(),
            contentPath: this.content.getPath().toString(),
            fields: this.content.getContentData().toJson(),
            topic: this.content.getDisplayName(),
            project: ProjectContext.get().getProject().getName(),
        });
    }

    private createContentLanguage(): ContentLanguage | undefined {
        const tag = ProjectContext.get().getProject().getLanguage() ?? this.content?.getLanguage();
        if (!tag) {
            return;
        }

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
        event.items?.forEach(({path, text}) => {
            // operator works now only with data and sends path without __group__ prefix, adding it for compatibility
            const pathWithGroup = `${AiContentDataHelper.DATA_PREFIX}${path.startsWith('/') ? '' : '/'}${path}`;
            this.aiContentDataHelper.setValue(this.aiContentDataHelper.replaceSlashesWithDots(pathWithGroup), text);
            this.aiToolHelper.animate(pathWithGroup, this.aiContentDataHelper.isTopicPath(pathWithGroup) ? 'innerGlow' : 'glow',
                RGBColor.GREEN);
        });
    };

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
}
