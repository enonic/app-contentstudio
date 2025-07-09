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
            await this.handleError('Fragment Inspection Panel', 'err_fragment_inspect_dropdown_handle', err)
        }
    }

    async getFragmentDropdownOptions() {
        let fragmentDropdown = new FragmentDropdown();
        return await fragmentDropdown.getOptionsDisplayName();
    }

    async typeNameAndSelectFragment(displayName) {
        let fragmentDropdown = new FragmentDropdown();
        await fragmentDropdown.selectFilteredFragment(displayName, xpath.container);
    }

    async clickOnOptionInFragmentDropdown(optionDisplayName) {
        let fragmentDropdown = new FragmentDropdown();
        await fragmentDropdown.clickOnOptionByDisplayName(optionDisplayName, xpath.container);
        await this.waitForSpinnerNotVisible();
    }

    async waitForOpened() {
        try {
            return await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Fragment Inspection Panel was not loaded', 'err_fragment_inspection_panel', err);
        }
    }

    async getSelectedOptionPath() {
        let fragmentDropdown = new FragmentDropdown();
        return await fragmentDropdown.getSelectedOptionPath(xpath.container)
    }

    async waitForEmptyOptionsMessage() {
        try {
            return await this.waitForElementDisplayed(xpath.container + lib.EMPTY_OPTIONS_H5, appConst.longTimeout);
        } catch (err) {
            await this.handleError('Fragment Inspection Panel, Empty options text is not visible', 'err_empty_options', err);
        }
    }
}

module.exports = FragmentInspectionPanel;

