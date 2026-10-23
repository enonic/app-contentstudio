import { cn, Toggle, Toolbar, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { type KeyboardEvent, type ReactElement } from 'react';
import { $isContextOpen, setContextOpen } from '../../shared/app-state/browsePanels.store';
import { focusContextPanelTarget } from '../../shared/lib/dom/contextPanelFocus';
import { useI18n } from '../../shared/lib/hooks/useI18n';

type Props = {
    className?: string;
    tooltipClassName?: string;
};

export const ContextToggle = ({ className, tooltipClassName }: Props): ReactElement => {
    const isContextOpen = useStore($isContextOpen);

    const showReachLabel = useI18n('tooltip.contextPanel.show');
    const hideReachLabel = useI18n('tooltip.contextPanel.hide');
    const contextLabel = isContextOpen ? hideReachLabel : showReachLabel;
    const ContextIcon = isContextOpen ? PanelRightClose : PanelRightOpen;

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
        if (
            !isContextOpen ||
            event.key !== 'ArrowDown' ||
            event.shiftKey ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey
        ) {
            return;
        }

        if (focusContextPanelTarget('selector')) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    return (
        <Tooltip delay={300} side="left" value={contextLabel} className={tooltipClassName} asChild>
            <Toolbar.Item asChild>
                <Toggle
                    data-context-panel-toggle
                    className={cn('size-9 p-0', className)}
                    size="sm"
                    aria-label={contextLabel}
                    startIcon={ContextIcon}
                    pressed={isContextOpen}
                    onPressedChange={setContextOpen}
                    onKeyDown={handleKeyDown}
                />
            </Toolbar.Item>
        </Tooltip>
    );
};

ContextToggle.displayName = 'ContextToggle';
