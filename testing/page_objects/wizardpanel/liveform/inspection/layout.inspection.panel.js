/**
 * Created on 19.02.2020.
 */

const Page = require('../../../page');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'LayoutInspectionPanel')]`,
    layoutDropdown: `//div[contains(@id,'LayoutDescriptorDropdown')]`,
    selectedOptionView: `//div[contains(@id,'SelectedOptionView')]`,
};

//Context Window, Inspect tab for Layout Component
class LayoutInspectionPanel extends Page {

    get layoutDropdown() {
        return xpath.container + xpath.layoutDropdown;
    }

    async typeNameAndSelectLayout(displayName) {
        let optionSelector = lib.slickRowByDisplayName(xpath.layoutDropdown, displayName);
        await this.waitForElementDisplayed(this.layoutDropdown + lib.DROPDOWN_OPTION_FILTER_INPUT, appConst.longTimeout);
        await this.typeTextInInput(this.layoutDropdown + lib.DROPDOWN_OPTION_FILTER_INPUT, displayName);
        await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
        await this.clickOnElement(optionSelector);
        return await this.pause(1000);
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_load_inspect_panel');
            throw new Error('Live Edit, Layout Inspection Panel is not loaded' + err);
        });
    }
};
module.exports = LayoutInspectionPanel;

