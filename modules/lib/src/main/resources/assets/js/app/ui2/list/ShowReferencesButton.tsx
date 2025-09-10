import {useEffect, useRef} from 'react';
import {ArchiveDialogHelper} from '../../dialog/ArchiveDialogHelper';
import type {Branch} from '../../versioning/Branch';
import type {ContentId} from '../../content/ContentId';

export type ShowReferencesButtonProps = {
    contentId: ContentId;
    target?: Branch;
    className?: string;
};

export function ShowReferencesButton({contentId, target, className}: ShowReferencesButtonProps) {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mountRef.current) {
            return;
        }
        const dispose = ArchiveDialogHelper.mountShowReferences(mountRef.current, contentId, target);
        return () => dispose();
    }, [contentId, target]);

    return (
        <div
            ref={mountRef}
            className={className}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        />
    );
}
