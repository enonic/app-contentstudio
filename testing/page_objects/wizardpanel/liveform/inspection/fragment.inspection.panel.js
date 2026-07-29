/**
 * Created on 19.02.2020. updated on 01.06.2026
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const {BUTTONS, DROPDOWN} = require('../../../../libs/elements');
const FragmentDropdown = require('../../../components/selectors/fragment.dropdown');

const xpath = {
    container: `//div[@data-component='FragmentInspectionPanel']`,
    fragmentContentSelector: `//div[@data-component='FragmentContentSelector']`,
};

//Content Wizard,Context Window, Inspect tab for Fragment Component
class FragmentInspectionPanel extends BaseComponentInspectionPanel {

    get fragmentDropdown() {
        return xpath.container + xpath.fragmentContentSelector;
    }

    get fragmentDropdownHandle() {
        return xpath.container + xpath.fragmentContentSelector + DROPDOWN.DROPDOWN_HANDLE;
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

    // returns the display name of the selected option in the fragment combobox:
    async getSelectedOption() {
        try {
            let fragmentDropdown = new FragmentDropdown(xpath.container);
            return await fragmentDropdown.getSelectedOption();
        } catch (err) {
            await this.handleError('Fragment Inspection Panel, selected option', 'err_fragment_selected_option', err);
        }
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

