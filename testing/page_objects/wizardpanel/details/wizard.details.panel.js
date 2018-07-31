/**
 * Created on 30/07/2018.
 */
const baseDetailsPanel = require('../../details_panel/base.details.panel');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'DockedDetailsPanel')]`,
    widgetSelectorDropdown: `//div[contains(@id,'WidgetSelectorDropdown')]`,

};
const wizardDetailsPanel = Object.create(baseDetailsPanel, {

    widgetSelectorDropdown: {
        get: function () {
            return `${xpath.container}` + `${xpath.widgetSelectorDropdown}`;
        }
    },
    widgetSelectorDropdownHandle: {
        get: function () {
            return `${xpath.container}` + `${xpath.widgetSelectorDropdown}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    isPanelVisible: {
        value: function () {
            return this.isVisible(xpath.container);
        }
    },
    waitForDetailsPanelLoaded: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_1).catch(err => {
                return false;
            });
        }
    },
});
module.exports = wizardDetailsPanel;


