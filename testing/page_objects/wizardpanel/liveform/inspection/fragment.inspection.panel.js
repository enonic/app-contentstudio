/**
 * Created on 19.02.2020.
 */

const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'FragmentInspectionPanel')]`,
    fragmentDropdown: `//div[contains(@id,'FragmentDropdown')]`,
    selectedOptionView: `//div[contains(@id,'SelectedOptionView')]`,
    editFragmentButton: "//button[child::span[contains(.,'Edit Fragment')]]"
};

//Context Window, Inspect tab for Fragment Component
class FragmentInspectionPanel extends BaseComponentInspectionPanel {

    get fragmentDropdown() {
        return xpath.container + xpath.fragmentDropdown;
    }

    get fragmentDropdownHandle() {
        return xpath.container + xpath.fragmentDropdown + lib.DROP_DOWN_HANDLE;
    }

    get editFragmentButton() {
        return xpath.container + xpath.editFragmentButton;
    }

    waitForEditFragmentButtonEnabled() {
        return this.waitForElementEnabled(this.editFragmentButton, appConst.mediumTimeout);
    }

    waitForEditFragmentButtonDisabled() {
        return this.waitForElementDisabled(this.editFragmentButton, appConst.mediumTimeout);
    }

    async clickOnEditFragmentButton() {
        await this.waitForEditFragmentButtonEnabled();
        await this.clickOnElement(this.editFragmentButton);
        return await this.pause(1000);
    }

    async clickOnFragmentDropdownHandle() {
        await this.waitForElementDisplayed(this.fragmentDropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.fragmentDropdownHandle);
        return await this.pause(300);
    }

    async getFragmentDropdownOptions() {
        let locator = xpath.container + xpath.fragmentDropdown + lib.SLICK_ROW + lib.H6_DISPLAY_NAME;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async typeNameAndSelectFragment(displayName) {
        await this.waitForElementDisplayed(this.fragmentDropdown + lib.DROPDOWN_OPTION_FILTER_INPUT, appConst.TIMEOUT_5);
        await this.typeTextInInput(this.fragmentDropdown + lib.DROPDOWN_OPTION_FILTER_INPUT, displayName);
        return await this.clickOnOptionInFragmentDropdown(displayName);
    }

    async clickOnOptionInFragmentDropdown(option) {
        let optionSelector = lib.slickRowByDisplayName(xpath.fragmentDropdown, option);
        await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
        await this.clickOnElement(optionSelector);
        await this.waitForSpinnerNotVisible();
        return await this.pause(2000);
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

    async waitForEmptyOptionsMessage() {
        try {
            return await this.waitForElementDisplayed(xpath.container + lib.EMPTY_OPTIONS_DIV, appConst.longTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_empty_options"));
            throw new Error("Empty options text is not visible " + err);
        }
    }
}

module.exports = FragmentInspectionPanel;

