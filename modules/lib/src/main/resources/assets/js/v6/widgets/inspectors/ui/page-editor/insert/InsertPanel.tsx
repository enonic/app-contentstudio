import { cn, Toolbar } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Box, Columns2, PenLine, Puzzle } from 'lucide-react';
import type { ReactElement } from 'react';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { $config } from '../../../../../shared/config/config.store';
import { $isFragment, $isInsertTabAvailable } from '../../../model/page-editor';
import { InsertableItem } from './InsertableItem';

type Props = {
    className?: string;
    onInserted?: (path: string, trigger: HTMLButtonElement) => void;
};

const INSERT_PANEL_NAME = 'InsertPanel';

export const InsertPanel = ({ className, onInserted }: Props): ReactElement => {
    const isFragment = useStore($isFragment);
    const canInsert = useStore($isInsertTabAvailable);
    const { enableTextComponent } = useStore($config, { keys: ['enableTextComponent'] });

    const partLabel = useI18n('field.part');
    const partDescription = useI18n('field.part.help');
    const layoutLabel = useI18n('field.layout');
    const layoutDescription = useI18n('field.layout.help');
    const textLabel = useI18n('field.text');
    const textDescription = useI18n('field.text.help');
    const fragmentLabel = useI18n('field.fragment');
    const fragmentDescription = useI18n('field.fragment.help');
    const insertLabel = useI18n('action.insert');

    return (
        <Toolbar.Root orientation="vertical" loop={false}>
            <Toolbar.Container
                data-component={INSERT_PANEL_NAME}
                aria-label={insertLabel}
                className={cn('items-stretch -mx-3 mt-5 px-2 py-0 gap-y-2.5', className)}
            >
                <InsertableItem
                    name="part"
                    icon={Box}
                    displayName={partLabel}
                    description={partDescription}
                    disabled={!canInsert}
                    onInserted={onInserted}
                />
                {!isFragment && (
                    <InsertableItem
                        name="layout"
                        icon={Columns2}
                        displayName={layoutLabel}
                        description={layoutDescription}
                        disabled={!canInsert}
                        onInserted={onInserted}
                    />
                )}
                {enableTextComponent && (
                    <InsertableItem
                        name="text"
                        icon={PenLine}
                        displayName={textLabel}
                        description={textDescription}
                        disabled={!canInsert}
                    />
                )}
                <InsertableItem
                    name="fragment"
                    icon={Puzzle}
                    displayName={fragmentLabel}
                    description={fragmentDescription}
                    disabled={!canInsert}
                    onInserted={onInserted}
                />
            </Toolbar.Container>
        </Toolbar.Root>
    );
};

InsertPanel.displayName = INSERT_PANEL_NAME;
