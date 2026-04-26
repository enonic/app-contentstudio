import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Box, Columns2, PenLine, Puzzle} from 'lucide-react';
import type {ReactElement} from 'react';
import {useI18n} from '../../../../../hooks/useI18n';
import {$isFragment} from '../../../../../store/page-editor';
import {InsertableItem} from './InsertableItem';

type Props = {
    className?: string;
};

const INSERT_PANEL_NAME = 'InsertPanel';

export const InsertPanel = ({className}: Props): ReactElement => {
    const isFragment = useStore($isFragment);

    const partLabel = useI18n('field.part');
    const partDescription = useI18n('field.part.help');
    const layoutLabel = useI18n('field.layout');
    const layoutDescription = useI18n('field.layout.help');
    const textLabel = useI18n('field.text');
    const textDescription = useI18n('field.text.help');
    const fragmentLabel = useI18n('field.fragment');
    const fragmentDescription = useI18n('field.fragment.help');

    return (
        <ul data-component={INSERT_PANEL_NAME} className={cn('flex flex-col -mx-3 mt-5 px-2 gap-y-2.5', className)}>
            <InsertableItem name="part" icon={Box} displayName={partLabel} description={partDescription} />
            {!isFragment && (
                <InsertableItem name="layout" icon={Columns2} displayName={layoutLabel} description={layoutDescription} />
            )}
            <InsertableItem name="text" icon={PenLine} displayName={textLabel} description={textDescription} />
            <InsertableItem name="fragment" icon={Puzzle} displayName={fragmentLabel} description={fragmentDescription} />
        </ul>
    );
};

InsertPanel.displayName = INSERT_PANEL_NAME;
