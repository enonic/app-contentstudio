/**
 * Created on 13.02.2024 updated on 24.02.2026
 */
const BasDropdown = require('../selectors/base.dropdown');
const {DROPDOWN, COMMON} = require('../../../libs/elements');
const XPATH = {
    container: "//div[child::label[contains(.,'Parent project')]]",
    searchInput: "//input[@aria-label='Search']",
    optionRowByDisplayName: displayName => `//div[@data-component='ProjectLabel' and descendant::span[contains(.,'${displayName}')]]`,
};

// Parent Step wizard - select a project in the dropdown selector
class ProjectsSelector extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    optionsFilterInput() {
        return XPATH.container + XPATH.searchInput;
    }

    async typeTextInSearchInput(text) {
        return await this.typeTextInInput(this.optionsFilterInput, text);
    }

    async waitForSearchInputDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.searchInput);
        } catch (err) {
            await this.handleError(`Projects Combobox, search input is not displayed`, 'err_search_input', err);
        }
    }

    async selectFilteredByIdAndClickOnApply(projectId, parentElement) {
        try {
            await this.clickOnFilteredByNameItemAndClickOnApply(projectId, parentElement);
        } catch (err) {
            await this.handleError(`Projects Combobox, tried to click on option by id: ${projectId}`, 'err_project_dropdown', err);
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

    async clickOnOptionByDisplayName(displayName, parent = '') {
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
