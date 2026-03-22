import {useEffect, useState} from 'react';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {GetMimeTypesByContentTypeNamesRequest} from '../../../app/resource/GetMimeTypesByContentTypeNamesRequest';

export function useAcceptMimeTypes(contentTypeNames: string[]): string | undefined {
    const [accept, setAccept] = useState<string>();

    useEffect(() => {
        if (contentTypeNames.length === 0) {
            return;
        }

        new GetMimeTypesByContentTypeNamesRequest(
            contentTypeNames.map(name => new ContentTypeName(name))
        ).sendAndParse().then((mimeTypes: string[]) => {
            setAccept(mimeTypes.join(','));
        });
    }, []);

    return accept;
}
