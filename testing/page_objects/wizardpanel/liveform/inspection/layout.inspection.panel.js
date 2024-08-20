/**
 * Created on 19.02.2020.
 */

const Page = require('../../../page');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const ComponentDescriptorsDropdown = require('../../../components/component.descriptors.dropdown');
const xpath = {
    container: `//div[contains(@id,'LayoutInspectionPanel')]`,
    layoutDropdown: `//div[contains(@id,'ComponentDescriptorsDropdown')]`,
    selectedOptionViewDiv: `//div[contains(@id,'SelectedOptionView')]`,
};

//Context Window, Inspect tab for Layout Component
class LayoutInspectionPanel extends Page {

    get layoutDropdown() {
        return xpath.container + xpath.layoutDropdown;
    }

    get layoutDropdownHandle() {
        return xpath.container + xpath.layoutDropdown + lib.DROP_DOWN_HANDLE;
    }

    async typeNameAndSelectLayout(displayName) {
        try {
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
            await componentDescriptorsDropdown.selectFilteredComponentAndClickOnOk(displayName, xpath.container);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_layout_inspect_panel');
            throw new Error('Layout Inspect Panel, Error during selecting a layout in the dropdown , screenshot:' + screenshot + ' ' + err);
        }
    }

    async waitForOpened() {
        try {
            return await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_load_layout_inspect_panel');
            throw new Error('Live Edit, Layout Inspection Panel is not loaded, screenshot' + screenshot + ' ' + err);
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
        await componentDescriptorsDropdown.clickOnApplySelectionButton(xpath.container);
        return await this.pause(1000);
    }

    async getSelectedOption() {
        let locator = xpath.container + xpath.selectedOptionViewDiv + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getLayoutDropdownOptions() {
        let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
        return await componentDescriptorsDropdown.getOptionsDisplayName(xpath.container);
    }
}

module.exports = LayoutInspectionPanel;

