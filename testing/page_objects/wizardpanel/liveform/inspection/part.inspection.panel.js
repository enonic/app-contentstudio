/**
 * Created on 02.05.2024
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');

const xpath = {
    container: "//div[contains(@id,'PartInspectionPanel')]",
    componentDescriptorsDropdownDiv: "//div[contains(@id,'ComponentDescriptorsDropdown')]",
};

// Context Window, Part Inspect tab
class PartInspectionPanel extends BaseComponentInspectionPanel {

    get container() {
        return xpath.container;
    }

    get partDropdownOptionsFilterInput() {
        return this.container + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    async getDropdownSelectedOption() {
        let locator = this.container + lib.INSPECT_PANEL.DESCRIPTOR_VIEWER_DIV + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    waitForOpened() {
        return this.waitForElementDisplayed(this.container);
    }
}

module.exports = PartInspectionPanel;
