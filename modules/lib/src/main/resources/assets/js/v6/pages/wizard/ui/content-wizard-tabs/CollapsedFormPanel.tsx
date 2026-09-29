import { type ReactElement, type Ref } from 'react';
import { ToggleFormButton } from './ToggleFormButton';

type CollapsedFormPanelProps = {
    displayName: string;
    onToggleForm: () => void;
    toggleButtonRef: Ref<HTMLButtonElement>;
};

export const CollapsedFormPanel = ({
    displayName,
    onToggleForm,
    toggleButtonRef,
}: CollapsedFormPanelProps): ReactElement => {
    return (
        <div className="flex flex-col items-center pt-1 gap-3 h-full">
            <ToggleFormButton ref={toggleButtonRef} onToggle={onToggleForm} />
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
