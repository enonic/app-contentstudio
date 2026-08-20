/**
 * Created on 02.05.2024
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const { DROPDOWN } = require('../../../../libs/elements');
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

    get partDropdownHandle() {
        return this.container + DROPDOWN.DESCRIPTOR_SELECTOR + DROPDOWN.DROPDOWN_HANDLE;
    }

    async clickOnPartDropdownHandle() {
        try {
            // hidden inspection panels can be present in the DOM, so click on the displayed dropdown handle:
            await this.waitUntilDisplayed(this.partDropdownHandle, appConst.mediumTimeout);
            let elements = await this.getDisplayedElements(this.partDropdownHandle);
            await elements[0].click();
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                'Part Inspection Panel, tried to click on the dropdown handle',
                'err_part_dropdown_handle',
                err,
            );
        }
    }

    // Expands the part-selector then clicks on the option with the given display name:
    async selectPart(displayName) {
        try {
            await this.clickOnPartDropdownHandle();
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(this.container);
            await componentDescriptorsDropdown.clickOnOptionByDisplayName(displayName);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(
                `Part Inspection Panel, tried to select the part: ${displayName}`,
                'err_select_part_option',
                err,
            );
        }
    }
}

module.exports = PartInspectionPanel;
