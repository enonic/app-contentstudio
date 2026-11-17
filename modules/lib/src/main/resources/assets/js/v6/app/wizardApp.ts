import { Body } from '@enonic/lib-admin-ui/dom/Body';
import { WindowDOM } from '@enonic/lib-admin-ui/dom/WindowDOM';
import type { Content } from '../../app/content/Content';
import { ContentEventsProcessor } from '../../app/ContentEventsProcessor';
import { NewContentEvent } from '../../app/create/NewContentEvent';
import { EditContentEvent } from '../../app/event/EditContentEvent';
import { ContentWizardPanel } from '../../app/wizard/ContentWizardPanel';
import type { ContentWizardPanelParams } from '../../app/wizard/ContentWizardPanelParams';
import { $wizardDraftDisplayName } from '../pages/wizard/model/wizardContent.store';
import {
    canShowContentFavicon,
    followContentInWizardTab,
    resolveUnnamedTabTitle,
    setWizardTabTitle,
    updateWizardTabFavicon,
} from '../pages/wizard/model/wizardTab.service';
import { i18n } from '../shared/i18n';
import { setMode } from '../shared/app-state/mode.store';

export type WizardAppOptions = {
    /** A CSS class that selects the theme. */
    theme: string;
    /** The tab already shows the content: the bootstrap loaded it before the application started. */
    tabPreloaded: boolean;
};

/**
 * Opens the content wizard. Called from the application bootstrap once the
 * projects are resolved and one of them is active.
 */
export function startWizardApp(params: ContentWizardPanelParams, { theme, tabPreloaded }: WizardAppOptions): void {
    const wizard = new ContentWizardPanel(params, theme);
    setMode('wizard');

    const unnamedTitle = (): string => resolveUnnamedTabTitle(wizard.getContentType()?.getTitle() ?? '');

    wizard.onDataLoaded((content: Content) => {
        if (!params.contentId || !tabPreloaded) {
            // new content has just been created, or the tab could not be prepared in advance
            updateWizardTabFavicon(content);

            if (canShowContentFavicon(content.getType())) {
                followContentInWizardTab(content.getContentId());
            }
        }

        if (!tabPreloaded) {
            setWizardTabTitle(content.getDisplayName() || unnamedTitle());
        }
    });

    $wizardDraftDisplayName.listen((displayName) => {
        if (wizard.getContentType()) setWizardTabTitle(displayName || unnamedTitle());
    });

    WindowDOM.get().onBeforeUnload((event: UIEvent) => {
        if (wizard.isContentDeleted()) return;

        if (wizard.hasUnsavedChanges() && !wizard.isReadOnly()) {
            const message = i18n('dialog.wizard.unsavedChanges');
            (event as unknown as { returnValue: string }).returnValue = message;
            return message;
        }
    });

    wizard.onClosed(() => window.close());

    EditContentEvent.on(ContentEventsProcessor.handleEdit);
    NewContentEvent.on(ContentEventsProcessor.handleNew);

    Body.get().addClass('wizard-page').appendChild(wizard);
}
