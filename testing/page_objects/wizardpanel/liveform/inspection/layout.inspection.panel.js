/**
 * Created on 19.02.2020.
 */
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const ComponentDescriptorsDropdown = require('../../../components/selectors/component.descriptors.dropdown');
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');

const xpath = {
    container: `//div[contains(@id,'LayoutInspectionPanel')]`,
    layoutDropdown: `//div[contains(@id,'ComponentDescriptorsDropdown')]`,
};

//Context Window, Inspect tab for Layout Component
class LayoutInspectionPanel extends BaseComponentInspectionPanel {

    get layoutDropdown() {
        return xpath.container + xpath.layoutDropdown;
    }

    get layoutDropdownHandle() {
        return xpath.container + xpath.layoutDropdown + lib.DROP_DOWN_HANDLE;
    }

    async typeNameAndSelectLayout(displayName) {
        try {
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
            await componentDescriptorsDropdown.selectFilteredComponent(displayName, xpath.container);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Layout Inspection Panel', 'err_layout_inspect_panel_dropdown', err);
        }
    }

    async waitForOpened() {
        try {
            return await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
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
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
        await componentDescriptorsDropdown.clickOnOptionByDisplayName(optionDisplayName, xpath.container);
        return await this.pause(1000);
    }

    async waitForApplyButtonInComponentsDescriptorNotDisplayed(optionDisplayName) {
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
        await componentDescriptorsDropdown.waitForApplySelectionButtonNotDisplayed(optionDisplayName, xpath.container);
    }

    async getSelectedOption() {
        let locator = xpath.container + lib.INSPECT_PANEL.DESCRIPTOR_VIEWER_DIV + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getLayoutDropdownOptions() {
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
        return await componentDescriptorsDropdown.getOptionsDisplayName(xpath.container);
    }
}

module.exports = LayoutInspectionPanel;

