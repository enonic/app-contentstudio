import {ContextPanel} from './ContextPanel';

export class ActiveContextPanelManager {

    private static activeContextPanel: ContextPanel;

    private static debouncedSetActiveContextPanel: (contextPanel: ContextPanel) => void = api.util.AppHelper.debounce(
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

        ActiveContextPanelManager.activeContextPanel = contextPanelToMakeActive;
        ActiveContextPanelManager.activeContextPanel.setActive();
    }
}
