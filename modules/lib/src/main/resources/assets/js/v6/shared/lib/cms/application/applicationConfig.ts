import { type PropertySet } from '@enonic/input-types/data';
import { type PropertyArrayJson } from '@enonic/ui-types';
import { type ApplicationKey } from './applicationKey';

export const APPLICATION_CONFIG_PROPERTY = {
    KEY: 'applicationKey',
    CONFIG: 'config',
} as const;

export type ApplicationConfig = {
    readonly applicationKey: ApplicationKey;
    readonly config: PropertySet;
};

export type ApplicationConfigJson = {
    applicationKey: ApplicationKey;
    config: PropertyArrayJson[];
};

export function applicationConfigToJson({ applicationKey, config }: ApplicationConfig): ApplicationConfigJson {
    return { applicationKey, config: config.toJson() };
}

type LegacyApplicationConfig = {
    getApplicationKey(): { toString(): string };
    getConfig(): PropertySet;
};

export function fromLegacyApplicationConfig(config: LegacyApplicationConfig): ApplicationConfig {
    return { applicationKey: config.getApplicationKey().toString(), config: config.getConfig() };
}
