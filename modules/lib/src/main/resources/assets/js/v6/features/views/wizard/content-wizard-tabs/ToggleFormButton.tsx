import {IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {PanelRightClose, PanelRightOpen} from 'lucide-react';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$isContentFormExpanded, toggleContentFormExpanded} from '../../../store/wizardContent.store';

export const ToggleFormButton = (): ReactElement => {
    const isContentFormExpanded = useStore($isContentFormExpanded);
    const expandLabel = useI18n('action.contentForm.expand');
    const collapseLabel = useI18n('action.contentForm.collapse');
    const contentFormLabel = isContentFormExpanded ? collapseLabel : expandLabel;
    const ContentFormIcon = isContentFormExpanded ? PanelRightOpen : PanelRightClose;

    const handleClick = (): void => {
        toggleContentFormExpanded();
    };

    return (
        <IconButton
            icon={ContentFormIcon}
            className="shrink-0"
            size="md"
            variant="text"
            aria-label={contentFormLabel}
            onClick={handleClick}
        />
    );
};

ToggleFormButton.displayName = 'ToggleFormButton';
