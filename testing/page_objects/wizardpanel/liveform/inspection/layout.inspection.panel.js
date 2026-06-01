/**
 * Created on 19.02.2020.
 */
const {DROPDOWN, COMMON} = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const ComponentDescriptorsDropdown = require('../../../components/selectors/component.descriptors.dropdown');
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');

const xpath = {
    container: "//div[@data-component='ComponentInspectionPanel' and descendant::span[text()='Layout']]",
};

//Context Window, Inspect tab for Layout Component
class LayoutInspectionPanel extends BaseComponentInspectionPanel {

    get layoutDropdown() {
        return xpath.container + xpath.layoutDropdown;
    }

    optionsFilterInput() {
        return xpath.container + COMMON.INPUTS.INPUT;
    }

    get layoutDropdownHandle() {
        return xpath.container + DROPDOWN.COMBOBOX_DROPDOWN_HANDLE;
    }

    async typeNameAndSelectLayout(displayName) {
        try {
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(xpath.container);
            await componentDescriptorsDropdown.selectFilteredComponent(displayName);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Layout Inspection Panel', 'err_layout_inspect_panel_dropdown', err);
        }
    }

    async waitForOpened() {
        try {
            return await this.waitForElementDisplayed(xpath.container);
        } catch (err) {
            await this.handleError('Layout Inspection Panel was not loaded', 'err_load_layout_inspect_panel', err);
        }
    }

    async clickOnLayoutDropdownHandle() {
        await this.waitForElementDisplayed(this.layoutDropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.layoutDropdownHandle);
        return await this.pause(300);
    }

    async clickOnOptionInLayoutDropdown(optionDisplayName) {
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(xpath.container);
        await componentDescriptorsDropdown.clickOnOptionByDisplayName(optionDisplayName);
        return await this.pause(1000);
    }

    async waitForApplyButtonInComponentsDescriptorNotDisplayed(optionDisplayName) {
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(xpath.container);
        await componentDescriptorsDropdown.waitForApplySelectionButtonNotDisplayed(optionDisplayName);
    }

    async getSelectedOption() {
        let locator = xpath.container + lib.INSPECT_PANEL.DESCRIPTOR_VIEWER_DIV + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getLayoutDropdownOptions() {
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(xpath.container);
        return await componentDescriptorsDropdown.getOptionsDisplayName();
    }

    async waitForLayoutOptionsFilterInputDisplayed() {
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(xpath.container);
        return await componentDescriptorsDropdown.waitForOptionFilterInputDisplayed();
    }
}

module.exports = LayoutInspectionPanel;

