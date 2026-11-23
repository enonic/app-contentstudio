import { type ReactElement, useLayoutEffect, useRef } from 'react';
import { useI18n } from '../lib/hooks/useI18n';

type SelectionCountAnnouncementProps = {
    ids: readonly string[];
    checkboxSelection: boolean;
};

const IDLE_ANNOUNCEMENT = '\u00a0';

export const SelectionCountAnnouncement = ({
    ids,
    checkboxSelection,
}: SelectionCountAnnouncementProps): ReactElement => {
    const message = useI18n('wcag.selection.count', ids.length);
    const selectionKey = JSON.stringify([checkboxSelection, ids]);
    const regionRef = useRef<HTMLSpanElement>(null);
    const initialized = useRef(false);

    useLayoutEffect(() => {
        const region = regionRef.current;
        if (!region) {
            return;
        }

        if (!initialized.current) {
            initialized.current = true;
            region.textContent = message;
            return;
        }

        // Reset so VoiceOver can announce the same count for a new selection.
        region.textContent = IDLE_ANNOUNCEMENT;
        const timer = setTimeout(() => {
            region.textContent = message;
        }, 100);
        return () => clearTimeout(timer);
    }, [message, selectionKey]);

    return <span ref={regionRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />;
};
