/**
 * Created on 19.02.2020.
 */

const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'FragmentInspectionPanel')]`,
    fragmentDropdown: `//div[contains(@id,'FragmentDescriptorDropdown')]`,
    selectedOptionView: `//div[contains(@id,'SelectedOptionView')]`,
};

//Context Window, Inspect tab for Fragment Component
class FragmentInspectionPanel extends BaseComponentInspectionPanel {

    get fragmentDropdown() {
        return xpath.container + xpath.fragmentDropdown;
    }

    async typeNameAndSelectFragment(displayName) {
        let optionSelector = lib.slickRowByDisplayName(xpath.fragmentDropdown, displayName);
        await this.waitForElementDisplayed(this.fragmentDropdown + lib.DROPDOWN_OPTION_FILTER_INPUT, appConst.TIMEOUT_5);
        await this.typeTextInInput(this.fragmentDropdown + lib.DROPDOWN_OPTION_FILTER_INPUT, displayName);
        await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
        await this.clickOnElement(optionSelector);
        return await this.pause(3000);
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_load_inspect_panel');
            throw new Error('Live Edit, Fragment Inspection Panel is not loaded' + err);
        });
    }

    async getSelectedOptionPath() {
        let selector = xpath.container + "//form[contains(@id,'FragmentSelectorForm')]" + xpath.selectedOptionView + lib.P_SUB_NAME;
        return await this.getText(selector);
    }
}
module.exports = FragmentInspectionPanel;

