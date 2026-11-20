import { type ReactElement, useEffect, useRef } from 'react';

type AnnouncementElement = HTMLSpanElement & {
    ariaNotify?: (message: string, options: { priority: 'normal' }) => void;
};

/** Announces changes separately from the visible error and its focus description. */
export const PoliteAnnouncement = ({ message }: { message: string | undefined }): ReactElement => {
    const regionRef = useRef<AnnouncementElement>(null);

    useEffect(() => {
        const region = regionRef.current;
        if (!region) {
            return;
        }
        region.replaceChildren();
        if (!message) {
            return;
        }

        const timer = setTimeout(() => {
            if (typeof region.ariaNotify === 'function') {
                region.ariaNotify(message, { priority: 'normal' });
            } else {
                region.appendChild(region.ownerDocument.createTextNode(message));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [message]);

    return <span ref={regionRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />;
};
