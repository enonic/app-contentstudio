import type {EnonicAiContentOperatorSetupData} from '../../../../app/ai/event/data/EnonicAiContentOperatorSetupData';
import type {EnonicAiTranslatorSetupData} from '../../../../app/ai/event/data/EnonicAiTranslatorSetupData';

export type EnonicAi = {
    contentOperator?: {
        setup(setupData: EnonicAiContentOperatorSetupData): void;
        render(buttonContainer: HTMLElement, dialogContainer: HTMLElement): void;
    };
    translator?: {
        setup(setupData: EnonicAiTranslatorSetupData): void;
        render(container: HTMLElement): void;
    };
};

export type EnonicAiPlugin = keyof EnonicAi;

declare global {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Window {
        Enonic?: {
            AI?: EnonicAi;
        };
    }
}

export const AI_PLUGIN_KEYS: Readonly<Record<EnonicAiPlugin, `com.enonic.app.ai.${string}`>> = {
    contentOperator: 'com.enonic.app.ai.contentoperator',
    translator: 'com.enonic.app.ai.translator',
};

export const AI_DATA_PREFIX = '__data__';

export const AI_XDATA_PREFIX = '__xdata__';

export const AI_PAGE_PREFIX = '__page__';

export const AI_CONFIG_PREFIX = '__config__';

export const AI_TOPIC = '__topic__';

export const AI_TOPIC_PATH = `/${AI_TOPIC}`;
