import { AlertTriangle } from 'lucide-react';
import type { ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { useHtmlAreaLinkDialogContext } from './HtmlAreaLinkDialogContext';

const COMPONENT_NAME = 'ContentTabReadOnlyPanel';

export const ContentTabReadOnlyPanel = (): ReactElement => {
    const {
        state: { uneditableLink },
    } = useHtmlAreaLinkDialogContext();

    const warningText = useI18n('dialog.link.content.noproject');

    return (
        <div data-component={COMPONENT_NAME} className="flex flex-col gap-4 pt-4">
            <StatusBarEntry className="bg-surface-warn">
                <AlertTriangle className="size-6 shrink-0" />
                <span className="text-sm font-semibold">{warningText}</span>
            </StatusBarEntry>
            <code className="text-sm break-all">{uneditableLink}</code>
        </div>
    );
};

ContentTabReadOnlyPanel.displayName = COMPONENT_NAME;
