import {type ReactElement} from 'react';
import {ToggleFormButton} from './ToggleFormButton';

type CollapsedFormPanelProps = {
    displayName: string;
};

export const CollapsedFormPanel = ({displayName}: CollapsedFormPanelProps): ReactElement => {
    return (
        <div className="flex flex-col items-center pt-1 gap-3 h-full">
            <ToggleFormButton />
            <span
                className="text-lg font-semibold text-subtle whitespace-nowrap overflow-hidden text-ellipsis max-h-full [writing-mode:vertical-lr]"
                title={displayName}
            >
                {displayName}
            </span>
        </div>
    );
};

CollapsedFormPanel.displayName = 'CollapsedFormPanel';
