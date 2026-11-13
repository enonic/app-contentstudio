import { ContentIcon } from './ContentIcon';
import { ContentStatusIcon } from './ContentStatusIcon';
import type { ContentState } from '../../../../app/content/ContentState';

type Props = {
    status: ContentState | null;
    contentType: string;
    url?: string | null;
    hasThumbnail?: boolean;
};

export function WorkflowContentIcon({ status, ...props }: Props): React.ReactElement {
    return (
        <span className="relative inline-flex items-center">
            <ContentIcon className="size-6" {...props} />
            {status && <ContentStatusIcon status={status} />}
        </span>
    );
}

WorkflowContentIcon.displayName = 'WorkflowContentIcon';
