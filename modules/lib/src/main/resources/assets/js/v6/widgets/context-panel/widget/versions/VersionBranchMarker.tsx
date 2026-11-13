import { Tooltip } from '@enonic/ui';
import { type ReactElement, useRef } from 'react';
import { useContentRowFocus } from '../../../../shared/lib/hooks/useContentRowFocus';
import type { VersionBranch } from './labels';

// Compact (D)/(M) tag whose tooltip names the target branch (draft/master).
export const VersionBranchMarker = ({ branch }: { branch: VersionBranch }): ReactElement => {
    const anchorRef = useRef<HTMLSpanElement>(null);
    const { focusTarget } = useContentRowFocus(anchorRef);

    return (
        <Tooltip value={branch} virtualFocus={focusTarget != null} focusDelay={500} delay={300} side="top">
            <span ref={anchorRef} className="inline-flex text-subtle text-sm font-semibold">
                ({branch.charAt(0).toUpperCase()})
            </span>
        </Tooltip>
    );
};

VersionBranchMarker.displayName = 'VersionBranchMarker';
