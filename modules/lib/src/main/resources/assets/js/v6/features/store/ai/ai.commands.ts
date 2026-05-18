import type {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import type {
    ContentData,
    ContentLanguage,
    ContentSchema,
    MixinContentData,
    MixinContentSchema,
    PageComponentData,
    PageComponentSchema,
    PageContentData,
    PageContentSchema,
} from '../../../../app/ai/event/data/AiData';
import {AiContentOperatorConfigureEvent} from '../../../../app/ai/event/outgoing/AiContentOperatorConfigureEvent';
import {AiTranslatorConfigureEvent} from '../../../../app/ai/event/outgoing/AiTranslatorConfigureEvent';
import {AiUpdateDataEvent} from '../../../../app/ai/event/outgoing/AiUpdateDataEvent';
import type {CompareStatus} from '../../../../app/content/CompareStatus';
import type {Content} from '../../../../app/content/Content';
import type {ContentType} from '../../../../app/inputtype/schema/ContentType';
import type {Page} from '../../../../app/page/Page';
import type {Component} from '../../../../app/page/region/Component';
import {DescriptorBasedComponent} from '../../../../app/page/region/DescriptorBasedComponent';
import {LayoutComponent} from '../../../../app/page/region/LayoutComponent';
import type {Region} from '../../../../app/page/region/Region';
import {TextComponent} from '../../../../app/page/region/TextComponent';
import type {ContentWizardHeader} from '../../../../app/wizard/ContentWizardHeader';
import {$locales} from '../languages.store';
import {
    $aiCompareStatus,
    $aiContent,
    $aiContentHeader,
    $aiContentType,
    $aiCurrentData,
    $aiDataTree,
    $aiInstructions,
    $aiReady,
    $aiTopicError,
    $aiWizardBridge,
    type AiWizardBridge,
} from './ai.store';
import {AI_PLUGIN_KEYS, type EnonicAiPlugin} from './ai.types';
import {getActiveProject, getActiveProjectName} from '../activeProject.store';

//
// * State setters
//

export function setAiContent(content: Content): void {
    $aiContent.set(content);
    new AiUpdateDataEvent({
        data: createContentData(),
        language: createContentLanguage(),
    }).fire();
}

export function setAiContentType(contentType: ContentType): void {
    $aiContentType.set(contentType);
    new AiUpdateDataEvent({schema: createContentSchema()}).fire();
}

export function setAiCurrentData(data: ContentData): void {
    $aiCurrentData.set(data);
    new AiUpdateDataEvent({data: createContentData()}).fire();
}

export function setAiLanguage(language: string): void {
    new AiUpdateDataEvent({language: createContentLanguage(language)}).fire();
}

export function setAiDataTree(dataTree: PropertyTree | null): void {
    $aiDataTree.set(dataTree);
}

export function setAiContentHeader(header: ContentWizardHeader): void {
    $aiContentHeader.set(header);
}

export function setAiCompareStatus(status: CompareStatus): void {
    $aiCompareStatus.set(status);
}

export function setAiWizardBridge(bridge: AiWizardBridge): void {
    $aiWizardBridge.set(bridge);
}

export function clearAiTopicError(): void {
    if ($aiTopicError.get() != null) {
        $aiTopicError.set(null);
    }
}

// Re-push the data + schema payload after a mixin-side change (xdata field edited,
// xdata enabled/disabled, descriptors loaded). Lets the AI Translator/Operator see
// the current xdata values and forms — they're not part of `content.getContentData()`.
export function notifyAiMixinsChanged(): void {
    new AiUpdateDataEvent({
        data: createContentData(),
        schema: createContentSchema(),
    }).fire();
}

// Re-push the data + schema payload after a page-side change (config, controller,
// text components, component configs). The Translator needs the current page tree
// to translate `__page__/...` paths; the Operator needs it for context.
export function notifyAiPageChanged(): void {
    new AiUpdateDataEvent({
        data: createContentData(),
        schema: createContentSchema(),
    }).fire();
}

export function updateAiInstructions(configs: ApplicationConfig[]): void {
    const current = $aiInstructions.get();
    const next: Record<EnonicAiPlugin, string | undefined> = current
        ? {...current}
        : {contentOperator: undefined, translator: undefined};

    let changed = current == null;

    const plugins = Object.keys(AI_PLUGIN_KEYS) as EnonicAiPlugin[];
    for (const plugin of plugins) {
        const appKey = AI_PLUGIN_KEYS[plugin];
        const pluginConfig = configs.find(c => c.getApplicationKey().getName() === appKey);
        if (!pluginConfig) {
            continue;
        }

        const value = pluginConfig.getConfig()?.getString('instructions') ?? '';
        if (next[plugin] !== value) {
            next[plugin] = value;
            notifyAiInstructionsChanged(plugin, value);
            changed = true;
        }
    }

    if (changed) {
        $aiInstructions.set(next);
    }
}

function notifyAiInstructionsChanged(plugin: EnonicAiPlugin, instructions: string): void {
    switch (plugin) {
        case 'contentOperator':
            new AiContentOperatorConfigureEvent({instructions}).fire();
            break;
        case 'translator':
            new AiTranslatorConfigureEvent({instructions}).fire();
            break;
    }
}

//
// * Ready
//

const readyCallbacks: (() => void)[] = [];

$aiReady.subscribe(ready => {
    if (!ready) {
        return;
    }

    while (readyCallbacks.length > 0) {
        const cb = readyCallbacks.shift();
        cb?.();
    }
});

export function whenAiReady(callback: () => void): void {
    if ($aiReady.get()) {
        callback();
        return;
    }

    readyCallbacks.push(callback);
}

//
// * Plugin rendering
//

export function renderContentOperator(buttonContainer: HTMLElement, dialogContainer: HTMLElement): void {
    window.Enonic?.AI?.contentOperator?.render(buttonContainer, dialogContainer);
}

export function renderTranslator(container: HTMLElement): void {
    window.Enonic?.AI?.translator?.render(container);
}

//
// * Event payload builders
//

export function createContentData(): ContentData | undefined {
    const current = $aiCurrentData.get();
    if (current) {
        return current;
    }

    const content = $aiContent.get();
    if (!content) {
        return undefined;
    }

    return {
        contentId: content.getContentId().toString(),
        contentPath: content.getPath().toString(),
        fields: content.getContentData().toJson(),
        topic: content.getDisplayName(),
        project: getActiveProjectName(),
        mixins: createMixinData(),
        page: createPageData(),
    };
}

// Live xdata values come from the wizard draft mixins (the same trees MixinView
// renders and the trees handleXDataEvent writes back into). Falling back to
// `content.getMixins()` keeps the payload populated before the bridge registers.
function createMixinData(): MixinContentData[] | undefined {
    const mixins = $aiWizardBridge.get()?.getCurrentMixins() ?? $aiContent.get()?.getMixins();
    if (!mixins || mixins.length === 0) {
        return undefined;
    }

    return mixins.map(mixin => ({
        name: mixin.getName().toString(),
        fields: mixin.getData().toJson(),
    }));
}

export function createContentLanguage(override?: string): ContentLanguage | undefined {
    const tag = override ?? getActiveProject().getLanguage() ?? $aiContent.get()?.getLanguage();
    if (!tag) {
        return undefined;
    }

    const locale = $locales.get().find(l => l.getTag() === tag);

    return {tag, name: locale ? locale.getDisplayName() : tag};
}

export function createContentSchema(): ContentSchema | undefined {
    const contentType = $aiContentType.get();
    if (!contentType) {
        return undefined;
    }

    return {
        form: contentType.getForm().toJson(),
        name: contentType.getTitle(),
        mixins: createMixinSchemas(),
        page: createPageSchema(),
    };
}

function createMixinSchemas(): MixinContentSchema[] | undefined {
    const descriptors = $aiWizardBridge.get()?.getCurrentMixinDescriptors();
    if (!descriptors || descriptors.length === 0) {
        return undefined;
    }

    return descriptors.map(descriptor => ({
        name: descriptor.getName(),
        form: descriptor.toForm().toJson(),
    }));
}

// Live page tree comes from the wizard draft. Component traversal walks every region
// (including layouts' nested regions) and emits an entry per TextComponent or
// DescriptorBasedComponent so the AI can address `__page__/<path>` (text) and
// `__page__/<path>/__config__/<dataPath>` (component config) paths.
function createPageData(): PageContentData | undefined {
    const page = $aiWizardBridge.get()?.getCurrentPage();
    if (!page) {
        return undefined;
    }

    const controller = page.hasController() ? page.getController().toString() : undefined;
    const config = page.hasConfig() ? page.getConfig().toJson() : undefined;
    const components = collectPageComponents(page);

    if (controller == null && config == null && components == null) {
        return undefined;
    }

    return {controller, config, components};
}

function collectPageComponents(page: Page): PageComponentData[] | undefined {
    const items: PageComponentData[] = [];
    walkRegions(page.getRegions()?.getRegions(), items);
    return items.length > 0 ? items : undefined;
}

function walkRegions(regions: Region[] | undefined, out: PageComponentData[]): void {
    regions?.forEach(region => region.getComponents().forEach(component => visitComponent(component, out)));
}

function visitComponent(component: Component, out: PageComponentData[]): void {
    const path = component.getPath().toString();

    if (component instanceof TextComponent) {
        const text = component.getText();
        if (text) out.push({path, text});
        return;
    }

    if (component instanceof DescriptorBasedComponent) {
        const descriptor = component.hasDescriptor() ? component.getDescriptorKey().toString() : undefined;
        const config = component.getConfig()?.toJson();
        if (descriptor != null || (config != null && config.length > 0)) {
            out.push({path, descriptor, config});
        }
    }

    if (component instanceof LayoutComponent) {
        walkRegions(component.getRegions()?.getRegions(), out);
    }
}

// Component descriptor forms are only included for descriptors currently held by the
// wizard (pages-in-edit usually have these resolved before the translator runs). The
// plugin should treat missing schemas as "unknown" rather than "absent".
function createPageSchema(): PageContentSchema | undefined {
    const bridge = $aiWizardBridge.get();
    if (!bridge) {
        return undefined;
    }

    const pageDescriptor = bridge.getCurrentPageDescriptor();
    const configForm = pageDescriptor?.getConfig()?.toJson();
    const componentForms = createPageComponentSchemas(bridge.getCurrentComponentDescriptors());

    if (configForm == null && componentForms == null) {
        return undefined;
    }

    return {configForm, componentForms};
}

function createPageComponentSchemas(descriptors: ReturnType<AiWizardBridge['getCurrentComponentDescriptors']>): PageComponentSchema[] | undefined {
    if (!descriptors || descriptors.length === 0) {
        return undefined;
    }

    return descriptors.map(descriptor => ({
        descriptor: descriptor.getKey().toString(),
        configForm: descriptor.getConfig().toJson(),
    }));
}
