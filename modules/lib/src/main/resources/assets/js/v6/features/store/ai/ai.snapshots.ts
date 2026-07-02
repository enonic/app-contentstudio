import type {
    AiContentSnapshot,
    AiLanguageSnapshot,
    AiPluginConfig,
    AiPluginId,
    AiSchemaSnapshot,
    AiState,
    AiUser,
} from './ai-protocol';
import { createContentData, createContentLanguage, createContentSchema } from './ai.commands';
import { $aiInstructions } from './ai.store';
import type { EnonicAiPlugin } from './ai.types';
import { $config } from '../../../shared/config/config.store';

//
// * State snapshots
//

export function buildContentSnapshot(): AiContentSnapshot | null {
    return createContentData() ?? null;
}

export function buildSchemaSnapshot(): AiSchemaSnapshot | null {
    return createContentSchema() ?? null;
}

export function buildLanguageSnapshot(): AiLanguageSnapshot | null {
    return createContentLanguage() ?? null;
}

export function buildState(): AiState {
    return {
        content: buildContentSnapshot(),
        schema: buildSchemaSnapshot(),
        language: buildLanguageSnapshot(),
    };
}

//
// * Plugin configuration
//

const ID_TO_LEGACY_PLUGIN: Record<AiPluginId, EnonicAiPlugin> = {
    'ai.translator': 'translator',
    'ai.contentOperator': 'contentOperator',
};

function buildUserSnapshot(): AiUser | undefined {
    const user = $config.get().user;
    if (user == null) {
        return undefined;
    }

    return {
        key: user.getKey().toString(),
        displayName: user.getDisplayName(),
    };
}

export function buildPluginConfig(id: AiPluginId): AiPluginConfig {
    const config = $config.get();
    const instructions = $aiInstructions.get()?.[ID_TO_LEGACY_PLUGIN[id]] ?? '';
    const user = buildUserSnapshot();

    if (id === 'ai.contentOperator') {
        return {
            wsServiceUrl: config.services.aiContentOperatorWsServiceUrl,
            sharedSocketUrl: config.sharedSocketUrl,
            instructions,
            user,
        };
    }

    return {
        wsServiceUrl: config.services.aiTranslatorWsServiceUrl,
        licenseServiceUrl: config.services.aiTranslatorLicenseServiceUrl,
        sharedSocketUrl: config.sharedSocketUrl,
        instructions,
        user,
    };
}
