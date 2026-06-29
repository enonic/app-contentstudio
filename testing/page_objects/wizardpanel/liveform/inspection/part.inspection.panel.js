/**
 * Created on 02.05.2024
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const {DROPDOWN} = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const ComponentDescriptorsDropdown = require('../../../components/selectors/component.descriptors.dropdown');

const xpath = {
    container: "//div[@data-component='ComponentInspectionPanel' and descendant::span[text()='Part']]",
    componentDescriptorsDropdownDiv: "//div[contains(@id,'ComponentDescriptorsDropdown')]",
};

// Context Window, Part Inspect tab
class PartInspectionPanel extends BaseComponentInspectionPanel {

    get container() {
        return xpath.container;
    }

    async typeNameAndSelectPart(displayName) {
        try {
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(xpath.container);
            await componentDescriptorsDropdown.selectFilteredComponent(displayName);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Part Inspection Panel', 'err_part_inspect_panel_dropdown', err);
        }
    }

    async getDropdownSelectedOption() {
        let locator = this.container + DROPDOWN.DESCRIPTOR_SELECTOR + DROPDOWN.COMBOBOX_VALUE;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    waitForOpened() {
        return this.waitForElementDisplayed(this.container);
    }
}

module.exports = PartInspectionPanel;
