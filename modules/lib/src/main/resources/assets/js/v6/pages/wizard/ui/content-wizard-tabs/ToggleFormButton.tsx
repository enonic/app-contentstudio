import { cn, IconButton } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { forwardRef, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { $isContentFormExpanded } from '../../model/wizardContent.store';
import {
    CONTENT_FORM_TOGGLE_NAME,
    focusDetachedPageComponentsList,
    focusDetachedPageComponentsTrigger,
    isDetachedPageComponentsPanelOpen,
} from '../layout/detached-page-components/detachedPageComponentsFocus';

type ToggleFormButtonProps = {
    onToggle: () => void;
};

export const ToggleFormButton = forwardRef<HTMLButtonElement, ToggleFormButtonProps>(
    ({ onToggle }, ref): ReactElement => {
        const isContentFormExpanded = useStore($isContentFormExpanded);
        const expandLabel = useI18n('action.contentForm.expand');
        const collapseLabel = useI18n('action.contentForm.collapse');
        const contentFormLabel = isContentFormExpanded ? collapseLabel : expandLabel;
        const ContentFormIcon = isContentFormExpanded ? ChevronLeft : ChevronRight;

        const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
            if (isContentFormExpanded || event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }

            if (event.key === 'Tab' && !event.shiftKey && isDetachedPageComponentsPanelOpen()) {
                if (focusDetachedPageComponentsList()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                return;
            }

            if (event.key !== 'ArrowDown' || event.shiftKey) {
                return;
            }

            if (isDetachedPageComponentsPanelOpen()) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            if (focusDetachedPageComponentsTrigger()) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        return (
            <IconButton
                ref={ref}
                data-component={CONTENT_FORM_TOGGLE_NAME}
                icon={ContentFormIcon}
                iconClassName={cn(isContentFormExpanded ? '-ml-0.5' : 'ml-0.5')}
                className="shrink-0"
                size="sm"
                iconSize="md"
                shape="round"
                variant="filled"
                aria-label={contentFormLabel}
                onClick={onToggle}
                onKeyDown={handleKeyDown}
            />
        );
    },
);

ToggleFormButton.displayName = CONTENT_FORM_TOGGLE_NAME;
