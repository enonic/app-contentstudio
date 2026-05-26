/**
 * Created on 13.02.2024 updated on 24.02.2026
 */
const BasDropdown = require('../selectors/base.dropdown');
const {DROPDOWN, COMMON} = require('../../../libs/elements');
const XPATH = {
    searchInput: "//input[@aria-label='Search']",
    optionRowByDisplayName: displayName => `//div[@data-component='ProjectLabel' and descendant::span[contains(.,'${displayName}')]]`,
};

// Parent Step wizard - select a project in the dropdown selector
class ProjectsSelector extends BasDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    // returns the element that contains the dropdown:
    get container() {
        return this._container;
    }

    optionsFilterInput() {
        return this.dataComponentDiv + DROPDOWN.OPTION_FILTER_INPUT;
    }

    get dataComponentDiv() {
        return "//div[@data-component='ProjectSelector']";
    }

    async typeTextInSearchInput(text) {
        return await this.typeTextInInput(this.optionsFilterInput(), text);
    }

    async waitForSearchInputDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.optionsFilterInput());
        } catch (err) {
            await this.handleError(`Projects Combobox, search input is not displayed`, 'err_search_input', err);
        }
    }

    async selectFilteredByDisplayNameAndClickOnApply(displayName) {
        try {
            await this.doFilterItem(displayName);
            await this.clickOnOptionByDisplayName(displayName);
            await this.clickOnApplySelectionButton();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_project_selector_dropdown');
            throw new Error(`Error occurred in Project Selector selector, screenshot:${screenshot} ` + err);
        }
    }

    async clickOnOptionByDisplayName(displayName) {
        try {
            let optionLocator = DROPDOWN.COMBOBOX_POPUP + XPATH.optionRowByDisplayName(displayName);
            await this.waitForElementDisplayed(optionLocator);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError(`Projects Combobox, tried to click on filtered  option: ${displayName}`, 'err_click_option', err);
        }
    }
}

module.exports = ProjectsSelector;
