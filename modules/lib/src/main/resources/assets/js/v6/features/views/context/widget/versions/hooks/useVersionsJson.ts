import {useEffect, useState} from 'react';
import {ResultAsync} from 'neverthrow';
import {ContentJson} from '../../../../../../../app/content/ContentJson';
import {fetchVersion} from '../../../../../api/versions';

type VersionsJsonResult = {
    olderVersionJson: ContentJson | null;
    newerVersionJson: ContentJson | null;
    isLoading: boolean;
    error: Error | null;
};

export const useVersionsJson = (
    contentId: string | undefined,
    olderVersionId: string | undefined,
    newerVersionId: string | undefined
): VersionsJsonResult => {
    const [olderVersionJson, setOlderVersionJson] = useState<ContentJson | null>(null);
    const [newerVersionJson, setNewerVersionJson] = useState<ContentJson | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!contentId || !olderVersionId || !newerVersionId) {
            setOlderVersionJson(null);
            setNewerVersionJson(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        const requests = olderVersionId === newerVersionId
                         ? [fetchVersion(contentId, olderVersionId)]
                         : [fetchVersion(contentId, olderVersionId), fetchVersion(contentId, newerVersionId)];

        ResultAsync.combine(requests).match(
            (results) => {
                if (cancelled) return;
                const [olderJson, newerJson] = results;
                setOlderVersionJson(olderJson);
                setNewerVersionJson(newerJson ?? olderJson);
                setIsLoading(false);
            },
            (err) => {
                if (cancelled) return;
                setError(err);
                setIsLoading(false);
            }
        );

        return () => {
            cancelled = true;
        };
    }, [contentId, olderVersionId, newerVersionId]);

    return {olderVersionJson, newerVersionJson, isLoading, error};
};
