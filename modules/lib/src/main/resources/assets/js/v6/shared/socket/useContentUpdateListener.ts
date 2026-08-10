import { useEffect, useRef } from 'react';
import type { ContentSummary } from '../../../app/content/ContentSummary';
import { $contentUpdated } from './socket.store';

/**
 * Notifies the consumer when a `$contentUpdated` server event contains the
 * watched content. Pass `undefined` to deactivate the subscription.
 */
export function useContentUpdateListener(
    contentId: string | undefined,
    onUpdated: (summary: ContentSummary) => void,
): void {
    const onUpdatedRef = useRef(onUpdated);
    onUpdatedRef.current = onUpdated;

    useEffect(() => {
        if (!contentId) {
            return;
        }

        return $contentUpdated.listen((event) => {
            const match = event?.data.find((summary) => summary.getId() === contentId);
            if (match) {
                onUpdatedRef.current(match);
            }
        });
    }, [contentId]);
}
