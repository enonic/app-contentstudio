import {cn} from '@enonic/ui';
import {Globe, Hash} from 'lucide-react';
import {type ReactElement} from 'react';
import {IssueType} from '../../../../../app/issue/IssueType';

import type {Issue} from '../../../../../app/issue/Issue';

export type IssueIconProps = {
    issue?: Issue;
    type?: IssueType;
    className?: string;
};

const ISSUE_ICON_NAME = 'IssueIcon';

export const IssueIcon = ({issue, type, className}: IssueIconProps): ReactElement | null => {
    const resolvedType = issue?.getType() ?? type;
    if (resolvedType === undefined) {
        return null;
    }

    const isTask = resolvedType === IssueType.STANDARD;
    const Icon = isTask ? Hash : Globe;

    return (
        <Icon
            data-component={ISSUE_ICON_NAME}
            className={cn(
                'size-6 shrink-0',
                isTask && 'border-subtle border-solid rounded-sm p-0.25 border-2',
                className,
            )}
        />
    );
};

IssueIcon.displayName = ISSUE_ICON_NAME;
