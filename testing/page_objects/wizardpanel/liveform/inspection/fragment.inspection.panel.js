/**
 * Created on 19.02.2020.
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const FragmentDropdown = require('../../../components/selectors/fragment.dropdown');

const xpath = {
    container: `//div[contains(@id,'FragmentInspectionPanel')]`,
    selectedOptionView: `//div[contains(@id,'SelectedOptionView')]`,
    editFragmentButton: "//button[child::span[contains(.,'Edit Fragment')]]"
};

//Content Wizard,Context Window, Inspect tab for Fragment Component
class FragmentInspectionPanel extends BaseComponentInspectionPanel {

    get fragmentDropdown() {
        return xpath.container + lib.DIV.FRAGMENT_DROPDOWN_DIV;
    }

    get fragmentDropdownHandle() {
        return xpath.container + lib.DIV.FRAGMENT_DROPDOWN_DIV + lib.DROP_DOWN_HANDLE;
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
        try {
            await this.waitForElementDisplayed(this.fragmentDropdownHandle, appConst.mediumTimeout);
            await this.clickOnElement(this.fragmentDropdownHandle);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_fragment_inspect');
            throw new Error("Fragment dropdown handle, screenshot:" + screenshot + ' ' + err);
        }
    }

    async getFragmentDropdownOptions() {
        let fragmentDropdown = new FragmentDropdown();
        return await fragmentDropdown.getOptionsDisplayName();
    }

    async typeNameAndSelectFragment(displayName) {
        let fragmentDropdown = new FragmentDropdown();
        await fragmentDropdown.selectFilteredFragmentAndClickOnOk(displayName, xpath.container);
    }

    async clickOnOptionInFragmentDropdownAndOk(optionDisplayName) {
        let fragmentDropdown = new FragmentDropdown();
        await fragmentDropdown.clickOnOptionByDisplayName(optionDisplayName, xpath.container);
        await fragmentDropdown.clickOnApplySelectionButton(xpath.container);
        await this.waitForSpinnerNotVisible();
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_load_inspect_panel');
            throw new Error('Live Edit, Fragment Inspection Panel is not loaded' + err);
        });
    }

    async getSelectedOptionPath() {
        let fragmentDropdown = new FragmentDropdown();
        return await fragmentDropdown.getSelectedOptionPath(xpath.container)
    }

    async waitForEmptyOptionsMessage() {
        try {
            return await this.waitForElementDisplayed(xpath.container + lib.EMPTY_OPTIONS_H5, appConst.longTimeout);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_empty_options');
            throw new Error("Empty options text is not visible " + err);
        }
    }
}

module.exports = FragmentInspectionPanel;

