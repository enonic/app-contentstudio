import { useEffect, useRef } from 'react';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { $contentUpdated } from '../../../shared/socket';

/**
 * Calls `onUpdated` when a content update event from the server carries the watched content.
 * Pass `undefined` as `contentId` to deactivate the subscription.
 *
 * Subscribes with `listen`, so an event emitted before mount is never replayed, and reads the
 * callback through a ref, so callers need not memoize it.
 *
 * Feature-local on purpose: the dialog is the only single-id consumer today. Promote it to
 * `shared/socket` once a second feature needs the same subscription.
 */
export function useOnContentUpdated(contentId: string | undefined, onUpdated: (summary: ContentSummary) => void): void {
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
