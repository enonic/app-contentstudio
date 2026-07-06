import { useEffect, useMemo, useState } from 'react';
import { fetchMimeTypesByContentTypeNames } from '../api/mimeTypes.api';

export function useAcceptMimeTypes(contentTypeNames: string[]): string | undefined {
    const [accept, setAccept] = useState<string>();
    // Stable dependency: join into a string so array reference changes don't re-trigger
    const key = useMemo(() => contentTypeNames.join(','), [contentTypeNames]);

    useEffect(() => {
        if (key === '') return;

        let cancelled = false;

        void fetchMimeTypesByContentTypeNames(key.split(',')).match(
            (mimeTypes) => {
                if (!cancelled) setAccept(mimeTypes.join(','));
            },
            (error) => {
                console.error(error);
            },
        );

        return () => {
            cancelled = true;
        };
    }, [key]);

    return accept;
}
