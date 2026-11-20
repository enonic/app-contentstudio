/**
 * Created on 22.02.2024
 */
const BasDropdown = require('../selectors/base.dropdown');
const { DROPDOWN } = require('../../../libs/elements');

// Applications Step wizard( or form panel) - select an application in the dropdown selector
class ProjectApplicationsCombobox extends BasDropdown {
    constructor(parentElementXpath) {
        super();
        this._parentContainer = parentElementXpath;
    }

    get container() {
        return this._parentContainer;
    }
    get dataComponentDiv() {
        return "//div[@data-component='ApplicationSelector']";
    }

    optionsFilterInput() {
        return this.container + DROPDOWN.OPTION_FILTER_INPUT;
    }

    async clickFilteredByAppNameItemAndClickOnOk(appDisplayName) {
        try {
            await this.doFilterItem(appDisplayName);
            await this.clickOnOptionByDisplayName(appDisplayName);
            await this.clickOnApplySelectionButton();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error(
                `Error occurred in Project Applications Comboboox selector, screenshot:${screenshot} ` + err,
            );
        }
    }

    // Returns the displayed option (Listbox.Item) in the expanded dropdown list:
    async #getDisplayedOption(appDisplayName) {
        let optionLocator = DROPDOWN.listboxItemByDisplayName(appDisplayName);
        await this.waitUntilDisplayed(optionLocator);
        let elements = await this.getDisplayedElements(optionLocator);
        return elements[0];
    }

    // An inherited application is a disabled option: 'aria-disabled' is set and it can not be unselected
    async isOptionDisabled(appDisplayName) {
        let option = await this.#getDisplayedOption(appDisplayName);
        return (await option.getAttribute('aria-disabled')) === 'true';
    }

    // The checkbox is not rendered in the option of an inherited application
    async isCheckboxDisplayedInOption(appDisplayName) {
        await this.#getDisplayedOption(appDisplayName);
        let elements = await this.getDisplayedElements(DROPDOWN.listboxItemCheckboxByDisplayName(appDisplayName));
        return elements.length > 0;
    }
}

module.exports = ProjectApplicationsCombobox;
