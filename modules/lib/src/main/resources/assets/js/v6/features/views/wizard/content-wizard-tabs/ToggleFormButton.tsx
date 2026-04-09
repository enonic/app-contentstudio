import {cn, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$isContentFormExpanded, toggleContentFormExpanded} from '../../../store/wizardContent.store';

const TOGGLE_FORM_BUTTON_NAME = 'ToggleFormButton';

export const ToggleFormButton = (): ReactElement => {
    const isContentFormExpanded = useStore($isContentFormExpanded);
    const expandLabel = useI18n('action.contentForm.expand');
    const collapseLabel = useI18n('action.contentForm.collapse');
    const contentFormLabel = isContentFormExpanded ? collapseLabel : expandLabel;
    const ContentFormIcon = isContentFormExpanded ? ChevronLeft : ChevronRight;

    return (
        <IconButton
            data-component={TOGGLE_FORM_BUTTON_NAME}
            icon={ContentFormIcon}
            iconClassName={cn(isContentFormExpanded ? '-ml-0.5' : 'ml-0.5')}
            className="shrink-0"
            size="sm"
            iconSize="md"
            shape="round"
            variant="filled"
            aria-label={contentFormLabel}
            onClick={toggleContentFormExpanded}
        />
    );
};

ToggleFormButton.displayName = TOGGLE_FORM_BUTTON_NAME;
