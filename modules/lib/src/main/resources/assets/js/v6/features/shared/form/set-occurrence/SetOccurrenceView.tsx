import {IconButton} from '@enonic/ui';
import {ChevronRight, X} from 'lucide-react';
import {type ReactElement, type ReactNode, useCallback, useState} from 'react';

type SetOccurrenceViewProps = {
    label?: string;
    index: number;
    canRemove: boolean;
    onRemove: (index: number) => void;
    children: ReactNode;
};

export const SetOccurrenceView = ({
    label,
    index,
    canRemove,
    onRemove,
    children,
}: SetOccurrenceViewProps): ReactElement => {
    const [expanded, setExpanded] = useState(true);

    const handleToggle = useCallback(() => {
        setExpanded(prev => !prev);
    }, []);

    const handleRemove = useCallback(() => {
        onRemove(index);
    }, [onRemove, index]);

    return (
        <div className="rounded border border-bdr-soft" data-component="SetOccurrenceView">
            <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-hover"
                aria-expanded={expanded}
                onClick={handleToggle}
            >
                <ChevronRight
                    size={16}
                    className={`shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
                />
                <span className="flex-1 truncate text-sm font-medium">
                    {label || `#${index + 1}`}
                </span>
                {canRemove && (
                    <IconButton
                        variant="text"
                        icon={X}
                        size="sm"
                        aria-label="Remove"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                    />
                )}
            </button>
            {expanded && (
                <div className="flex flex-col gap-7.5 border-t border-bdr-soft px-4 py-4">
                    {children}
                </div>
            )}
        </div>
    );
};

SetOccurrenceView.displayName = 'SetOccurrenceView';
