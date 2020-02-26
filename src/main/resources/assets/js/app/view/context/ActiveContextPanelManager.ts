import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContextPanel} from './ContextPanel';

export class ActiveContextPanelManager {

    private static activeContextPanel: ContextPanel;

    private static debouncedSetActiveContextPanel: (contextPanel: ContextPanel) => void = AppHelper.debounce(
        ActiveContextPanelManager.doSetActiveContextPanel, 300, true);

    static setActiveContextPanel(contextPanelToMakeActive: ContextPanel) {
        ActiveContextPanelManager.debouncedSetActiveContextPanel(contextPanelToMakeActive);
    }

    static getActiveContextPanel(): ContextPanel {
        return ActiveContextPanelManager.activeContextPanel;
    }

    private static doSetActiveContextPanel(contextPanelToMakeActive: ContextPanel) {
        let currentlyActivePanel = ActiveContextPanelManager.getActiveContextPanel();
        if (currentlyActivePanel === contextPanelToMakeActive || !contextPanelToMakeActive) {
            return;
        }

        if (ActiveContextPanelManager.activeContextPanel) {
            ActiveContextPanelManager.activeContextPanel.removeClass('active');
        }
        contextPanelToMakeActive.addClass('active');

        ActiveContextPanelManager.activeContextPanel = contextPanelToMakeActive;
        ActiveContextPanelManager.activeContextPanel.setActive();
    }
}
