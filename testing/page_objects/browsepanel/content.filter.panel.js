/**
 * Created on 1.12.2017. updated for epic-enonic-ui on 26.02.2026
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const {BUTTONS} = require('../../libs/elements');
const XPATH = {
    container: "//div[contains(@id,'ContentBrowseFilterPanel')]",
    clearFilterLink: "//a[contains(@id,'ClearFilterButton')]",
    searchInput: "//input[contains(@aria-label,'Search')]",
    dependenciesSection: "//div[@data-component='BrowseDependencies']",
    showResultsButton: "//span[contains(@class,'show-filter-results')]",
    showMoreButton: "//button[child::span[text()='Show more']]",
    showLessButton: "//button[child::span[text()='Show less']]",
    selectorOptionCheckbox: "//ul[contains(@id,'BucketListBox')]//div[contains(@id,'Checkbox')]",
    selectorOptionItem: "//ul[contains(@id,'BucketListBox')]//div[contains(@class,'item-view-wrapper')]",
    ownerAggregationGroupView: "//div[child::div[text()='Owner'] and descendant::*[@data-component='Combobox.Content']]",
    lastModifiedByAggregationGroupView: "//div[child::div[text()='Last Modified by'] and descendant::*[@data-component='Combobox.Content']]",
    comboboxToggle: "//button[@data-component='Combobox.Toggle']",
    comboboxInput: "//input[@data-component='Combobox.Input']",
    comboboxOption: name => `//li[@role='option' and contains(.,'${name}')]`,
    checkboxInputByLabel: name => `//label[descendant::span[contains(.,'${name}')]]/input[@type='checkbox']`,
    checkboxLabelText: "//div[@data-component='Checkbox']//span[contains(@class,'text-main')]",
    aggregationGroupByName: name => `//div[child::h4[text()='${name}'] or child::div[text()='${name}']]`,
    aggregationLabelByName: name => `//label[child::input[@type='checkbox'] and descendant::span[contains(.,'${name}')]]`,
};

class BrowseFilterPanel extends Page {

    get clearFilterLink() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Clear');
    }

    get exportButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Export');
    }

    get showMoreButton() {
        return `${XPATH.container}//div[child::h4[text()='Content Types']]${BUTTONS.buttonAriaLabel('Show more')}`;
    }

    get showLessButton() {
        return `${XPATH.container}//div[child::h4[text()='Content Types']]${BUTTONS.buttonAriaLabel('Show less')}`;
    }


    get closeDependenciesSectionButtonLocator() {
        return XPATH.dependenciesSection + "//button[@data-component='IconButton']";
    }

    get searchTextInput() {
        return XPATH.container + XPATH.searchInput;
    }

    async clearSearchInput() {
        let input = await this.findElement(this.searchTextInput);
        await input.click();
        await this.clearInputTextElement(input);
    }

    async typeSearchText(text) {
        try {
            await this.typeTextInInput(this.searchTextInput, text);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Filter Panel: Search Input', 'err_filter_input', err);
        }
    }

    async waitForExportButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.exportButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Filter Panel: Export Button should be displayed', 'err_export_btn', err);
        }
    }

    async waitForExportButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.exportButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Filter Panel: Export Button should not be displayed', 'err_export_btn_not_displayed', err);
        }
    }

    async waitForExportButtonEnabled() {
        try {
            await this.waitForExportButtonDisplayed();
            await this.waitForElementEnabled(this.exportButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Filter Panel: Export Button should be enabled', 'err_export_btn_enabled', err);
        }
    }

    async clickOnExportButton() {
        await this.waitForExportButtonEnabled();
        await this.clickOnElement(this.exportButton);
    }

    async waitForOpened() {
        await this.waitForElementDisplayed(XPATH.container);
        await this.pause(300);
    }

    async waitForClosed() {
        await this.waitForElementNotDisplayed(XPATH.container);
        await this.pause(300);
    }

    waitForShowMoreButtonDisplayed() {
        return this.waitForElementDisplayed(this.showMoreButton);
    }

    waitForShowMoreButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.showMoreButton, appConst.shortTimeout);
    }

    async clickOnShowMoreButton() {
        await this.waitForShowMoreButtonDisplayed();
        return await this.clickOnElement(this.showMoreButton);
    }

    isShowMoreButtonDisplayed() {
        return this.isElementDisplayed(this.showMoreButton)
    }

    waitForShowLessButtonDisplayed() {
        return this.waitForElementDisplayed(this.showLessButton, appConst.shortTimeout);
    }

    waitForShowLessButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.showLessButton, appConst.shortTimeout);
    }

    async waitForCloseDependenciesSectionButtonDisplayed() {
        try {
            let el = await this.findElements(this.closeDependenciesSectionButtonLocator);
            return await this.waitForElementDisplayed(this.closeDependenciesSectionButtonLocator);
        } catch (err) {
            await this.handleError('Filter Panel: Close dependencies section button should be displayed', 'err_close_dependencies_section_btn', err);
        }
    }

    isPanelVisible() {
        return this.isElementDisplayed(XPATH.container);
    }

    waitForClearLinkDisplayed() {
        return this.waitForElementDisplayed(this.clearFilterLink, appConst.mediumTimeout)
    }

    waitForClearLinkNotDisplayed() {
        return this.waitForElementNotDisplayed(this.clearFilterLink, appConst.mediumTimeout)
    }

    async waitForDependenciesSectionVisible(ms = appConst.mediumTimeout) {
        try {
            return await this.waitForElementDisplayed(XPATH.container + XPATH.dependenciesSection, ms);
        } catch (err) {
            await this.handleError('Filter Panel: Dependencies section should be visible', 'err_dependencies_section', err);
        }
    }

    async clickOnClearButton() {
        await this.waitForClearLinkDisplayed();
        await this.clickOnElement(this.clearFilterLink)
        await this.pause(1000);
    }

    async isClearButtonDisplayed() {
        return await this.isElementDisplayed(this.clearFilterLink);
    }

    async waitForAggregationGroupDisplayed(blockName) {
        let selector = XPATH.aggregationGroupByName(blockName);
        return await this.waitForElementDisplayed(selector);
    }

    //clicks on a checkbox in Content Types aggregation block
    async clickOnCheckboxInContentTypesBlock(contentType) {
        try {
            let selector = XPATH.aggregationGroupByName('Content Types') + XPATH.aggregationLabelByName(contentType);
            await this.pause(1000);
            let result = await this.getDisplayedElements(this.showMoreButton);
            if (result.length > 0) {
                await this.clickOnShowMoreButton();
            }
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            await this.clickOnElement(selector);
            return await this.pause(700);
        } catch (err) {
            await this.handleError('Filter Panel: Tried to click on checkbox in  aggregation block', 'err_click_checkbox', err);
        }
    }

    async waitForCheckboxDisplayed(blockName, label) {
        try {
            let selector = XPATH.aggregationGroupByName(blockName) + XPATH.aggregationLabelByName(label);
            return await this.waitForElementDisplayed(selector);
        } catch (err) {
            await this.handleError(`Filter Panel: checkbox '${label}' in '${blockName}' should be displayed`, 'err_checkbox_displayed', err);
        }
    }

    async waitForCheckboxNotDisplayed(blockName, checkBoxLabel) {
        try {
            let selector = XPATH.aggregationGroupByName(blockName) + XPATH.aggregationLabelByName(checkBoxLabel);
            return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Filter Panel: checkbox '${checkBoxLabel}' in '${blockName}' should not be displayed`, 'err_checkbox_not_displayed', err);
        }
    }

    // clicks on a checkbox in Workflow aggregation block
    async clickOnCheckboxInWorkflowBlock(checkBoxLabel) {
        try {
            let selector = XPATH.aggregationGroupByName(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW) +
                           XPATH.aggregationLabelByName(checkBoxLabel);
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            await this.clickOnElement(selector);
            return await this.pause(1200);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_click_on_aggregation"));
            throw new Error("Error when click on the aggregation checkbox: " + err);
        }
    }

    async clickOnCheckboxInLanguageBlock(checkBoxLabel) {
        try {
            let selector = XPATH.aggregationGroupByName(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LANGUAGE) +
                           XPATH.aggregationLabelByName(checkBoxLabel);
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            await this.clickOnElement(selector);
            return await this.pause(1200);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_click_on_aggregation"));
            throw new Error('Error when click on the aggregation checkbox: ' + err);
        }
    }

    // gets a number of items from a checkbox label in an aggregation block(Workflow,modifier)
    async getNumberOfItemsInAggregationView(blockName, checkboxLabel, showMore) {
        if (typeof showMore !== 'undefined') {
            if (showMore && await this.isShowMoreButtonDisplayed()) {
                await this.clickOnShowMoreButton();
            }
        }
        try {
            let locator = XPATH.aggregationGroupByName(blockName) + XPATH.aggregationLabelByName(checkboxLabel);
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            let label = await this.getText(locator);
            let startIndex = label.indexOf('(');
            let endIndex = label.indexOf(')');
            return label.substring(startIndex + 1, endIndex);
        } catch (err) {
            await this.handleError('Filter Panel: Tried to get the number in aggregation', 'err_numb_in_aggregation', err);
        }
    }

    // Gets the count from a label in 'Content Types' aggregation block (e.g. "Image (24)" → "24")
    async getNumberInAggregationLabel(contentType) {
        return await this.getNumberOfItemsInAggregationView('Content Types', contentType);
    }

    // Gets display names of items in "Content Types" block, without the count suffix (e.g. "Image (24)" → "Image")
    async geContentTypes() {
        let locator = XPATH.aggregationGroupByName('Content Types') + "//label[child::input[@type='checkbox']]";
        await this.waitForElementDisplayed(locator);
        let labels = await this.getTextInDisplayedElements(locator);
        return labels.map(item => item.substring(0, item.indexOf('(')).trim());
    }

    // Gets the count from a label in 'Last Modified' aggregation block (e.g. "< 1 week (41)" → "41")
    async getLastModifiedCount(timestamp) {
        return await this.getNumberOfItemsInAggregationView('Last Modified', timestamp);
    }

    // Expands the 'Owner' combobox:
    async clickOnOwnerDropdownHandle() {
        try {
            let locator = XPATH.container + XPATH.ownerAggregationGroupView + XPATH.comboboxToggle;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Filter Panel: Owner combobox toggle', 'err_owner_toggle', err);
        }
    }

    // gets options name from the 'Owner' list box:
    async getOwnerNameInSelector() {
        let locator = XPATH.container + XPATH.ownerAggregationGroupView + XPATH.checkboxLabelText;
        let elements = await this.getDisplayedElements(locator);
        let owners = [];
        for (let el of elements) {
            let text = await el.getText();
            owners.push(text.substring(0, text.indexOf('(')).trim());
        }
        return owners;
    }

    // Selects an option in 'Owner' combobox: types the name in the filter input and clicks on the option
    async filterAndSelectOwnerOption(ownerName) {
        try {
            let inputLocator = XPATH.container + XPATH.ownerAggregationGroupView + XPATH.comboboxInput;
            await this.waitForElementDisplayed(inputLocator, appConst.mediumTimeout);
            await this.typeTextInInput(inputLocator, ownerName);
            await this.pause(300);
            let optionLocator = XPATH.container + XPATH.ownerAggregationGroupView + XPATH.comboboxOption(ownerName);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError('Filter Panel: Owner Selector', 'err_filter_owner', err);
        }
    }

    // Expands the 'Last Modified By' combobox:
    async clickOnLastModifiedByDropdownHandle() {
        try {
            let locator = XPATH.container + XPATH.lastModifiedByAggregationGroupView + XPATH.comboboxToggle;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Filter Panel: Last Modified By combobox toggle', 'err_last_modified_by_toggle', err);
        }
    }

    async isCheckedInLastModifiedByListOptions(userName) {
        let locator = XPATH.container + XPATH.lastModifiedByAggregationGroupView + XPATH.checkboxInputByLabel(userName);
        let chElement = await this.findElement(locator);
        let ariaChecked = await chElement.getAttribute('aria-checked');
        return ariaChecked === 'true';
    }

    async uncheckItemInLastModifiedByListBox(userName) {
        try {
            let locator = XPATH.container + XPATH.lastModifiedByAggregationGroupView + XPATH.checkboxInputByLabel(userName);
            let chElement = await this.findElement(locator);
            await chElement.click();
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Filter Panel: uncheck item in Last Modified By', 'err_uncheck_last_modified_by', err);
        }
    }

    // Selects an option in 'Last Modified By' combobox: types the name in the filter input and clicks on the option
    async filterAndSelectLastModifiedByOption(userName) {
        try {
            let inputLocator = XPATH.container + XPATH.lastModifiedByAggregationGroupView + XPATH.comboboxInput;
            await this.waitForElementDisplayed(inputLocator, appConst.mediumTimeout);
            await this.typeTextInInput(inputLocator, userName);
            await this.pause(300);
            let optionLocator = XPATH.container + XPATH.lastModifiedByAggregationGroupView + XPATH.comboboxOption(userName);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError('Filter Panel: Modified By Selector', 'err_filter_modified_by', err);
        }
    }
}

module.exports = BrowseFilterPanel;
