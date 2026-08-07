/**
 * Created on 04.04.2022 updated on 07.08.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const { DROPDOWN } = require('../../../libs/elements');
const ContentSelectorDropdown = require('../../components/selectors/content.selector.dropdown');

const XPATH = {
    container: "//div[@data-component='Tab.Content' and contains(@id,'contenttypes:content-selector')]",
    contentCombobox: "//div[@data-component='ContentCombobox']",
    selectedOptionItem: "//div[@data-component='SelectorSelectionItem']",
    selectedOptionDisplayNameSpan:
        "//div[@data-component='SelectorSelectionItem']//span[contains(@class,'font-semibold')]",
};

class XDataContentSelector extends Page {
    get contentOptionsFilterInput() {
        return XPATH.container + XPATH.contentCombobox + DROPDOWN.OPTION_FILTER_DATA_COMPONENT;
    }

    async filterOptionsAndSelectContent(displayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            await contentSelectorDropdown.doFilterItem(displayName);
            await contentSelectorDropdown.clickOnTreeItemOptionByDisplayName(displayName);
            return await this.pause(200);
        } catch (err) {
            await this.handleError(
                'X-data, content selector - tried to select the option',
                'err_xdata_content_selector',
                err,
            );
        }
    }

    async waitForSelectedOptionDisplayed() {
        let locator = XPATH.container + XPATH.selectedOptionItem;
        return await this.waitForElementDisplayed(locator, appConst.shortTimeout);
    }

    async removeSelectedOption(option) {
        let contentSelectorDropdown = new ContentSelectorDropdown(XPATH.container);
        await contentSelectorDropdown.removeSelectedOption(option);
    }

    async waitForContentOptionsFilterInputDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.contentOptionsFilterInput, appConst.shortTimeout);
        } catch (err) {
            await this.handleError(
                'x-data, Content Selector - options filter input should be visible',
                'err_xdata_content_filter_input',
                err,
            );
        }
    }

    async getSelectedOptions() {
        let locator = XPATH.container + XPATH.selectedOptionDisplayNameSpan;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = XDataContentSelector;
