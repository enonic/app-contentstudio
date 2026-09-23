import type { InputConfigJson } from '@enonic/ui-types';

export const SITE_PATH = '${site}';

export function readAllowPath(raw: InputConfigJson, fallback: string[]): string[] {
    return raw?.['allowPath']?.map((cfg) => cfg['value'] as string).filter((val) => !!val) ?? fallback;
}
