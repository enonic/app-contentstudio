import { useMemo } from 'react';
import type { ContentId } from '../../../../app/content/ContentId';

export const useContentIdSet = (ids: readonly ContentId[]): ReadonlySet<string> => {
    return useMemo(() => new Set(ids.map((id) => id.toString())), [ids]);
};
