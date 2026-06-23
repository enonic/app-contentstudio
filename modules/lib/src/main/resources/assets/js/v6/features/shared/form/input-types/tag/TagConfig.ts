import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';
import {TextLineDescriptor, type TextLineConfig} from '@enonic/lib-admin-ui/form2/descriptor';

export const TAG_SITE_PATH = '${site}/*';

export type TagConfig = TextLineConfig & {
    allowPath: string[];
    allowPathConfigured: boolean;
};

export function readTagConfig(raw: RawInputConfig): TagConfig {
    const textLineConfig = TextLineDescriptor.readConfig(raw);
    const rawAllowPath = raw?.allowPath;
    const hasConfiguredAllowPath = rawAllowPath != null && rawAllowPath.length > 0;
    const allowPath = hasConfiguredAllowPath
        ? rawAllowPath.map(cfg => (typeof cfg.value === 'string' ? cfg.value.trim() : '')).filter(value => value.length > 0)
        : [TAG_SITE_PATH];

    return {
        ...textLineConfig,
        allowPath,
        allowPathConfigured: hasConfiguredAllowPath,
    };
}
