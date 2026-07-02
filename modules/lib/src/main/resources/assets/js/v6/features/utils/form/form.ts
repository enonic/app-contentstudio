import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';

export const SITE_PATH = '${site}';

export function readAllowPath(raw: RawInputConfig, fallback: string[]): string[] {
    return raw?.['allowPath']?.map((cfg) => cfg['value'] as string).filter((val) => !!val) ?? fallback;
}
