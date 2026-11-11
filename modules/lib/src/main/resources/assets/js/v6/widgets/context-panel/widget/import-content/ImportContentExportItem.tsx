import { RadioGroup, Tooltip } from '@enonic/ui';
import { type ReactElement } from 'react';

const TOOLTIP_DELAY_MS = 1500;

export const ImportContentExportItem = ({ name }: { name: string }): ReactElement => {
    return (
        <Tooltip value={name} side="left" delay={TOOLTIP_DELAY_MS} focusDelay={TOOLTIP_DELAY_MS}>
            <div className="w-full min-w-0">
                <RadioGroup.Item
                    value={name}
                    aria-label={name}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer hover:bg-surface-neutral-hover w-full min-w-0"
                >
                    <RadioGroup.Indicator />
                    <span className="font-mono text-sm text-left truncate block w-full">{name}</span>
                </RadioGroup.Item>
            </div>
        </Tooltip>
    );
};

ImportContentExportItem.displayName = 'ImportContentExportItem';
