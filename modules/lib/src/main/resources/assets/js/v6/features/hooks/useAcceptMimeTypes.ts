import {useEffect, useMemo, useState} from 'react';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {GetMimeTypesByContentTypeNamesRequest} from '../../../app/resource/GetMimeTypesByContentTypeNamesRequest';

export function useAcceptMimeTypes(contentTypeNames: string[]): string | undefined {
    const [accept, setAccept] = useState<string>();
    // Stable dependency: join into a string so array reference changes don't re-trigger
    const key = useMemo(() => contentTypeNames.join(','), [contentTypeNames]);

    useEffect(() => {
        if (key === '') return;

        let cancelled = false;

        new GetMimeTypesByContentTypeNamesRequest(key.split(',').map((name) => new ContentTypeName(name)))
            .sendAndParse()
            .then((mimeTypes: string[]) => {
                if (!cancelled) setAccept(mimeTypes.join(','));
            })
            .catch((error) => {
                console.error(error);
            });

        return () => {
            cancelled = true;
        };
    }, [key]);

    return accept;
}
