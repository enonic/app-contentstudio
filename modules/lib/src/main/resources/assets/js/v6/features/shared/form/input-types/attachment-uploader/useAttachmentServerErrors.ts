import {useMemo} from 'react';
import {useStore} from '@nanostores/preact';
import {$attachmentServerErrorEntries} from '../../../../store/wizardValidation.store';

export function useAttachmentServerErrors(names: string[]): ReadonlyMap<string, string> {
    const entries = useStore($attachmentServerErrorEntries);

    return useMemo(() => {
        const map = new Map<string, string>();
        for (const entry of entries) {
            if (names.includes(entry.attachment) && !map.has(entry.attachment)) {
                map.set(entry.attachment, entry.message);
            }
        }
        return map;
    }, [entries, names]);
}
