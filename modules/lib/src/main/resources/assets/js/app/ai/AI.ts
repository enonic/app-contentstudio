import {AiHelper} from '@enonic/lib-admin-ui/ai/AiHelper';
import {AiHelperState} from '@enonic/lib-admin-ui/ai/AiHelperState';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Content} from '../content/Content';
import {ContentRequiresSaveEvent} from '../event/ContentRequiresSaveEvent';
import {ContentType} from '../inputtype/schema/ContentType';
import {ComponentPath} from '../page/region/ComponentPath';
import {DescriptorBasedComponent} from '../page/region/DescriptorBasedComponent';
import {PageItem} from '../page/region/PageItem';
import {TextComponent} from '../page/region/TextComponent';
import {ProjectContext} from '../project/ProjectContext';
import {GetLocalesRequest} from '../resource/GetLocalesRequest';
import {ContentWizardHeader} from '../wizard/ContentWizardHeader';
import {PageState} from '../wizard/page/PageState';
import {XDataWizardStepForm} from '../wizard/XDataWizardStepForm';
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
import {AiAnimationHandler, RGBColor} from './ui/AiAnimationHandler';

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

    private static PAGE_PREFIX = '__page__';

    private static CONFIG_PREFIX = '__config__';

    private static TOPIC = '__topic__';

    private currentData: ContentData | undefined;

    private content: Content;

    private contentType: ContentType;

    private data: PropertyTree;

    private contentHeader: ContentWizardHeader;

    private locales: Locale[];

    private instructions: Record<EnonicAiPlugin, string | undefined>;

    private readyListeners: (() => void)[] = [];

    private context?: string;

    private constructor() {
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

    setDataTree(dataTree: PropertyTree): void {
        this.data = dataTree;
    }

    setContentHeader(contentHeader: ContentWizardHeader): void {
        this.contentHeader = contentHeader;
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
        this.getAiHelperByPath(event.path)?.setState(AiHelperState.PROCESSING);
    };

    private translatorCompletedEventListener = (event: AiTranslatorCompletedEvent) => {
        const helper = this.getAiHelperByPath(event.path);

        if (event.success) {
            helper?.setState(AiHelperState.COMPLETED);
            this.handleFieldUpdate(event.path, event.text);
        } else {
            helper?.setState(AiHelperState.FAILED, {text: event.text});
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
        AiHelper.setActiveContext(event.context);
    };

    private handleDialogOpenedEvent = () => {
        AiHelper.setActiveContext(this.context);
    }

    private handleDialogClosedEvent = () => {
        AiHelper.setActiveContext(null);
    }

    private handleInteractionEvent = (event: AiContentOperatorInteractionEvent) => {
        switch (event.interaction) {
        case 'click':
            this.handleClickInteractionEvent(event.path);
            break;
        }
    }

    private handleClickInteractionEvent = (path: string) => {
        const helper = this.getAiHelperByPath(path);

        if (helper) {
            AiAnimationHandler.scroll(helper.getDataPathElement());

            if (this.isTopicPath(path)) {
                AiAnimationHandler.innerGlow(helper.getDataPathElement());
            } else {
                AiAnimationHandler.glow(helper.getDataPathElement());
            }
        }
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
        event.items?.forEach(({path, text}) => {
            this.handleFieldUpdate(this.replaceSlashesWithDots(path), text);

            const helper = this.getAiHelperByPath(path);

            if (helper) {
                if (this.isTopicPath(path)) {
                    AiAnimationHandler.innerGlow(helper.getDataPathElement(), RGBColor.GREEN);
                } else {
                    AiAnimationHandler.glow(helper.getDataPathElement(), RGBColor.GREEN);
                }
            }
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

    private getAiHelperByPath(pathWithSlashed: string): AiHelper | undefined {
        const path = this.replaceSlashesWithDots(pathWithSlashed);

        if (this.isXDataPath(path)) {
            return this.getAiHelperByXData(path);
        }

        return AiHelper.getAiHelpers().find((helper: AiHelper) => helper.getDataPath().toString() === path);
    }

    private handleFieldUpdate(path: string, text: string): void {
        if (this.isTopicPath(path)) {
            this.contentHeader.setDisplayName(text);
        } else if (this.isXDataPath(path)) {
            this.handleXDataEvent(path, text);
        } else if (this.isPagePath(path)) {
            this.handlePageEvent(path, text);
        } else {
            this.handleDataEvent(path, text);
        }
    }

    private isXDataPath(path: string): boolean {
        return path.startsWith(AI.XDATA_PREFIX);
    }

    private isPagePath(path: string): boolean {
        return path.startsWith(AI.PAGE_PREFIX);
    }

    private isTopicPath(path: string): boolean {
        return path.startsWith(AI.TOPIC);
    }

    private getAiHelperByXData(path: string): AiHelper | undefined {
        const xData = this.getXData(path);

        return xData?.xDataStepForm ? AiHelper.getAiHelpers().find((helper: AiHelper) => this.isHelperForXData(helper, xData)) : null;
    }

    private getXData(path: string): { xDataStepForm: XDataWizardStepForm, xDataPath: PropertyPath } | undefined {
        const pathParts = path.split('.');
        const appName = pathParts[1];
        const xDataName = pathParts[2];
        const key = `${appName.replace(/-/g, '.')}:${xDataName}`;
        const xDataStepForm = XDataWizardStepForm.getXDataWizardStepForm(key);

        return xDataStepForm ? {xDataStepForm, xDataPath: PropertyPath.fromString(`.${pathParts.slice(3).join('.')}`)} : undefined;
    }

    private isHelperForXData(helper: AiHelper, xData: { xDataStepForm: XDataWizardStepForm, xDataPath: PropertyPath }): boolean {
        return xData.xDataStepForm.contains(helper.getDataPathElement()) && helper.getDataPath().equals(xData.xDataPath);
    }

    private handleXDataEvent(path: string, text: string): void {
        const xData = this.getXData(this.replaceSlashesWithDots(path));
        const prop = xData?.xDataStepForm.getData().getRoot().getPropertyByPath(xData.xDataPath);
        this.updateProperty(prop, text);
    }

    private handleDataEvent(path: string, text: string): void {
        const propPath = PropertyPath.fromString(this.replaceSlashesWithDots(path));
        const prop = this.data.getRoot().getPropertyByPath(propPath);
        this.updateProperty(prop, text);
    }

    private updateProperty(property: Property | undefined, value: string): void {
        property?.setValue(new Value(value, property.getType()));
    }

    private replaceSlashesWithDots(path: string): string {
        return path.replace(/\//g, '.');
    }

    private handlePageEvent(path: string, text: string): void {
        if (path.indexOf(AI.CONFIG_PREFIX) > -1) {
            this.handleComponentConfigEvent(path, text);
        } else {
            this.handleComponentEvent(path, text);
        }
    }

    private handleComponentConfigEvent(path: string, text: string): void {
        const parts = path.replace(AI.PAGE_PREFIX, '').split(`/${AI.CONFIG_PREFIX}`);
        const configComponentPath = parts[0];
        const dataPath = parts[1];
        const propPath = PropertyPath.fromString(this.replaceSlashesWithDots(dataPath));

        if (StringHelper.isBlank(configComponentPath)) {
            const prop = PageState.getState()?.getConfig().getRoot().getPropertyByPath(propPath);
            prop?.setValue(new Value(text, prop.getType()));
        } else {
            const item: PageItem = PageState.getState()?.getComponentByPath(ComponentPath.fromString(configComponentPath));

            if (item instanceof DescriptorBasedComponent) {
                const prop = item.getConfig().getRoot().getPropertyByPath(propPath);
                prop?.setValue(new Value(text, prop.getType()));
            }
        }
    }

    private handleComponentEvent(path: string, text: string): void {
        const pathNoPrefix = path.replace(AI.PAGE_PREFIX, '');
        const componentPath = ComponentPath.fromString(pathNoPrefix);
        const item: PageItem = PageState.getState().getComponentByPath(componentPath);

        if (item instanceof TextComponent) {
            item.setText(text);
        }
    }
}
