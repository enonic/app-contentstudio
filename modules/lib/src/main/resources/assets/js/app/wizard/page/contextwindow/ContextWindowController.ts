import {ContextWindow} from './ContextWindow';
import {ShowContentFormEvent} from '../../ShowContentFormEvent';
import {ShowSplitEditEvent} from '../../ShowSplitEditEvent';
import {ShowLiveEditEvent} from '../../ShowLiveEditEvent';
import {ContentWizardPanel} from '../../ContentWizardPanel';
import {TogglerButton} from '@enonic/lib-admin-ui/ui/button/TogglerButton';
import {ElementHiddenEvent} from '@enonic/lib-admin-ui/dom/ElementHiddenEvent';

export class ContextWindowController {

    private contextWindow: ContextWindow;

    private componentsViewToggler: TogglerButton;

    private contentWizardPanel: ContentWizardPanel;

    constructor(contextWindow: ContextWindow, contentWizardPanel: ContentWizardPanel) {
        this.contextWindow = contextWindow;
        this.contentWizardPanel = contentWizardPanel;
        this.componentsViewToggler = contentWizardPanel.getComponentsViewToggler();

        const componentsView = this.contextWindow.getComponentsView();

        this.componentsViewToggler.onActiveChanged((isActive: boolean) => {
            if (!componentsView.getParentElement() && isActive) {
                contentWizardPanel.appendChild(componentsView);
            }

            componentsView.setVisible(isActive);
        });

        componentsView.onHidden((event: ElementHiddenEvent) => {
            if (this.componentsViewToggler.isActive()) {
                this.componentsViewToggler.setActive(false);
            }
        });

        let liveEditShownHandler = () => {
            if (this.contextWindow.isLiveFormShown() && this.contentWizardPanel.isRenderable()) {
                this.componentsViewToggler.setEnabled(true);
            }
        };

        let liveEditHiddenHandler = () => {
            this.componentsViewToggler.setEnabled(false);
        };

        ShowLiveEditEvent.on(liveEditShownHandler);
        ShowSplitEditEvent.on(liveEditShownHandler);
        ShowContentFormEvent.on(liveEditHiddenHandler);
    }
}
