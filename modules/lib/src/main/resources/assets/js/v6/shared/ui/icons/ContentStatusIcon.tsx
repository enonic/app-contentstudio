import { Tooltip } from '@enonic/ui';
import { type ReactElement, useRef } from 'react';
import type { ContentState } from '../../../../app/content/ContentState';
import { useI18n } from '../../lib/hooks/useI18n';
import { useContentRowFocus } from '../../lib/hooks/useContentRowFocus';
import { getStatusTooltipKey, StatusIcon } from './StatusIcon';

export const ContentStatusIcon = ({ status }: { status: ContentState }): ReactElement => {
    const anchorRef = useRef<HTMLSpanElement>(null);
    const { focusTarget, sorting } = useContentRowFocus(anchorRef);
    const label = useI18n(getStatusTooltipKey(status));

    return (
        <Tooltip
            value={label}
            virtualFocus={focusTarget != null}
            focusDelay={500}
            delay={300}
            disabled={sorting}
            side="top"
        >
            <span ref={anchorRef} className="absolute -top-0.75 -right-0.75 inline-flex">
                <StatusIcon status={status} />
            </span>
        </Tooltip>
    );
};

ContentStatusIcon.displayName = 'ContentStatusIcon';
