/**
 * Created on 19.02.2020. updated on 01.06.2026
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const {BUTTONS} = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const FragmentDropdown = require('../../../components/selectors/fragment.dropdown');

const xpath = {
    container: `//div[@data-component='FragmentInspectionPanel']`,
    selectedOptionView: `//div[contains(@id,'SelectedOptionView')]`,
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
        return xpath.container + BUTTONS.buttonAriaLabel('Edit Fragment');
    }

    waitForEditFragmentButtonEnabled() {
        return this.waitForElementEnabled(this.editFragmentButton);
    }

    waitForEditFragmentButtonDisabled() {
        return this.waitForElementDisabled(this.editFragmentButton);
    }

    async clickOnEditFragmentButton() {
        await this.waitForEditFragmentButtonEnabled();
        await this.clickOnElement(this.editFragmentButton);
        return await this.pause(1000);
    }

    async clickOnFragmentDropdownHandle() {
        try {
            await this.waitForElementDisplayed(this.fragmentDropdownHandle);
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
        let fragmentDropdown = new FragmentDropdown(xpath.container);
        await fragmentDropdown.selectFilteredFragment(displayName);
    }

    async clickOnOptionInFragmentDropdown(optionDisplayName) {
        let fragmentDropdown = new FragmentDropdown(xpath.container);
        await fragmentDropdown.clickOnOptionByDisplayName(optionDisplayName);
        await this.waitForSpinnerNotVisible();
    }

    async waitForOpened() {
        try {
            return await this.waitForElementDisplayed(xpath.container);
        } catch (err) {
            await this.handleError('Fragment Inspection Panel was not loaded', 'err_fragment_inspection_panel', err);
        }
    }

    async getSelectedOptionPath() {
        let fragmentDropdown = new FragmentDropdown(xpath.container);
        return await fragmentDropdown.getSelectedOptionPath(xpath.container)
    }

    async waitForEmptyOptionsMessage() {
        try {
            let locator = "//div[@data-component='Combobox.Popup']//span[contains(@class,'text-subtle') and contains(text(),'No matching items')]"
            return await this.waitForElementDisplayed(locator);
        } catch (err) {
            await this.handleError('Fragment Inspection Panel, Empty options text is not visible', 'err_empty_options', err);
        }
    }
}

module.exports = FragmentInspectionPanel;

