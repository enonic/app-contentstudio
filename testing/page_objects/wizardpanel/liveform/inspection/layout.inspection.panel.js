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

    get container() {
        return xpath.container;
    }
    optionsFilterInput() {
        return xpath.container + COMMON.INPUTS.INPUT;
    }

    get layoutDropdownHandle() {
        return xpath.container + DROPDOWN.DROPDOWN_HANDLE;
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
        try {
            // hidden inspection panels can be present in the DOM, so click on the displayed dropdown handle:
            await this.waitUntilDisplayed(this.layoutDropdownHandle, appConst.mediumTimeout);
            let elements = await this.getDisplayedElements(this.layoutDropdownHandle);
            await elements[0].click();
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Layout Inspection Panel, tried to click on the dropdown handle', 'err_layout_dropdown_handle', err);
        }
    }

    async clickOnOptionInLayoutDropdown(optionDisplayName) {
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(xpath.container);
        await componentDescriptorsDropdown.clickOnOptionByDisplayName(optionDisplayName);
        return await this.pause(1000);
    }

    // returns the display name of the selected option in the collapsed layout combobox:
    async getSelectedOption() {
        try {
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(xpath.container);
            return await componentDescriptorsDropdown.getSelectedOption();
        } catch (err) {
            await this.handleError('Layout Inspection Panel, selected option', 'err_layout_selected_option', err);
        }
    }

    async waitForApplyButtonInComponentsDescriptorNotDisplayed(optionDisplayName) {
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown(xpath.container);
        await componentDescriptorsDropdown.waitForApplySelectionButtonNotDisplayed(optionDisplayName);
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

