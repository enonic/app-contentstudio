import type { InputConfigEntries } from '@enonic/input-types';

export const SITE_PATH = '${site}';

export function readAllowPath(raw: InputConfigEntries, fallback: string[]): string[] {
    return raw?.['allowPath']?.map((cfg) => cfg['value'] as string).filter((val) => !!val) ?? fallback;
}
