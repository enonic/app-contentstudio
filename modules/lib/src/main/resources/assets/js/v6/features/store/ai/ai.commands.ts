import type {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import type {ContentData, ContentLanguage, ContentSchema} from '../../../../app/ai/event/data/AiData';
import {AiContentOperatorConfigureEvent} from '../../../../app/ai/event/outgoing/AiContentOperatorConfigureEvent';
import {AiTranslatorConfigureEvent} from '../../../../app/ai/event/outgoing/AiTranslatorConfigureEvent';
import {AiUpdateDataEvent} from '../../../../app/ai/event/outgoing/AiUpdateDataEvent';
import type {CompareStatus} from '../../../../app/content/CompareStatus';
import type {Content} from '../../../../app/content/Content';
import type {ContentType} from '../../../../app/inputtype/schema/ContentType';
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
} from './ai.store';
import {AI_PLUGIN_KEYS, type EnonicAiPlugin} from './ai.types';
import {getActiveProjectName} from '../activeProject.store';

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

export function setAiDataTree(dataTree: PropertyTree): void {
    $aiDataTree.set(dataTree);
}

export function setAiContentHeader(header: ContentWizardHeader): void {
    $aiContentHeader.set(header);
}

export function setAiCompareStatus(status: CompareStatus): void {
    $aiCompareStatus.set(status);
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
    };
}

export function createContentLanguage(override?: string): ContentLanguage | undefined {
    const tag = override ?? $aiContent.get()?.getLanguage();
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
    };
}
