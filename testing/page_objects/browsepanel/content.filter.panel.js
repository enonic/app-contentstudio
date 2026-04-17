/**
 * Created on 1.12.2017. updated for epic-enonic-ui on 26.02.2026
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements-old');
const {BUTTONS} = require('../../libs/elements');
const FilterableListBox = require('../components/selectors/filterable.list.box');

const XPATH = {
    container: "//div[contains(@id,'ContentBrowseFilterPanel')]",
    clearFilterLink: "//a[contains(@id,'ClearFilterButton')]",
    searchInput: "//input[contains(@aria-label,'Search')]",
    dependenciesSection: "//div[contains(@id,'DependenciesSection')]",
    showResultsButton: "//span[contains(@class,'show-filter-results')]",
    showMoreButton: "//button[child::span[text()='Show more']]",
    showLessButton: "//button[child::span[text()='Show less']]",
    selectorOptionCheckbox: "//ul[contains(@id,'BucketListBox')]//div[contains(@id,'Checkbox')]",
    selectorOptionItem: "//ul[contains(@id,'BucketListBox')]//div[contains(@class,'item-view-wrapper')]",
    ownerAggregationGroupView: "//div[contains(@id,'FilterableAggregationGroupView') and child::h2[text()='Owner']]",
    lastModifiedByAggregationGroupView: "//div[contains(@id,'FilterableAggregationGroupView') and child::h2[text()='Last Modified by']]",
    aggregationGroupByName: name => `//div[child::h4[text()='${name}']]`,
    aggregationLabelByName: name => `//label[child::input[@type='checkbox'] and descendant::span[contains(.,'${name}')]]`,
};

class BrowseFilterPanel extends Page {

    get clearFilterLink() {
        return XPATH.container + XPATH.clearFilterLink;
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
        return XPATH.dependenciesSection + "//button[contains(@class,'btn-close')]";
    }

    get searchTextInput() {
        return XPATH.container + XPATH.searchInput;
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
            return await this.waitForElementDisplayed(this.closeDependenciesSectionButtonLocator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_close_dependencies_section_btn');
            throw new Error("Error Close dependencies section should be displayed, screenshot: " + screenshot + ' ' + err);
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
            return await this.waitForElementDisplayed(XPATH.container + XPATH.dependenciesSection, ms)
        } catch (err) {
            await this.handleError('Filter Panel: Dependencies section should be visible', 'err_dependencies_section', err);
        }
    }

    async clickOnClearLink() {
        await this.waitForClearLinkDisplayed();
        await this.clickOnElement(this.clearFilterLink)
        await this.pause(1000);
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
        let selector = XPATH.aggregationGroupByName(blockName) + XPATH.aggregationLabelByName(label);
        return await this.waitForElementDisplayed(selector);
    }

    async waitForCheckboxNotDisplayed(blockName, checkBoxLabel) {
        let selector = XPATH.aggregationGroupByName(blockName) + XPATH.aggregationLabelByName(checkBoxLabel);
        return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
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

    // Expands the 'Owner' dropdown:
    async clickOnOwnerDropdownHandle() {
        let locator = XPATH.container + XPATH.ownerAggregationGroupView + lib.DROPDOWN_SELECTOR.DROPDOWN_HANDLE;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.clickOnElement(locator);
        await this.pause(500);
    }

    // gets options name from the 'Owner' list box:
    async getOwnerNameInSelector() {
        let owners = [];
        let filterableListBox = new FilterableListBox();
        let optionNames = await filterableListBox.getOptionsDisplayName(XPATH.ownerAggregationGroupView);
        optionNames.map(item => {
            let value = item.substring(0, item.indexOf('('));
            owners.push(value.trim());
        })
        return owners;
    }

    // Selects an option in 'Owner' dropdown: types the name in the filter input and clicks on the filtered option
    async filterAndSelectOwnerOption(ownerName) {
        try {
            let filterableListBox = new FilterableListBox();
            await filterableListBox.clickOnFilteredByDisplayNameItemAndClickOnApply(ownerName, XPATH.ownerAggregationGroupView);
        } catch (err) {
            await this.handleError('Filter Panel: Owner Selector', 'err_filter_owner', err);
        }
    }

    // Expands the 'Last Modified By' dropdown:
    async clickOnLastModifiedByDropdownHandle() {
        let filterableListBox = new FilterableListBox();
        await filterableListBox.clickOnDropdownHandle(XPATH.lastModifiedByAggregationGroupView);
    }

    async isCheckedInLastModifiedByListOptions(userName) {
        let locator = XPATH.lastModifiedByAggregationGroupView + lib.DROPDOWN_SELECTOR.listItemByDisplayName(userName) +
                      lib.CHECKBOX_INPUT;
        let chElement = await this.findElements(locator);
        return await chElement[0].isSelected();
    }

    async uncheckItemInLastModifiedByListBox(userName) {
        let locator = XPATH.lastModifiedByAggregationGroupView + lib.DROPDOWN_SELECTOR.listItemByDisplayName(userName);
        let chElement = await this.findElements(locator);
        await chElement[0].click();
        let filterableListBox = new FilterableListBox();
        await filterableListBox.clickOnApplySelectionButton(XPATH.lastModifiedByAggregationGroupView);
    }

    // Selects an option in 'Last Modified By' dropdown:
    async filterAndSelectLastModifiedByOption(userName) {
        try {
            let filterableListBox = new FilterableListBox();
            // 1. insert the username in the filter input:
            await this.filterItemInModifiedBy(userName);
            let optionLocator = filterableListBox.buildLocatorForOptionByDisplayName(userName, XPATH.lastModifiedByAggregationGroupView);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            // 2. Click on the option-item, select the user in the dropdown:
            await this.clickOnElement(optionLocator);
            // 3. Click on 'OK' button and apply the selection:
            return await filterableListBox.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError('Filter Panel: Modified By Selector', 'err_filter_modified_by', err);
        }
    }

    async filterItemInModifiedBy(text) {
        let locator = XPATH.lastModifiedByAggregationGroupView + lib.OPTION_FILTER_INPUT;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        let elements = await this.getDisplayedElements(locator);
        await elements[0].setValue(text);
        return await this.pause(300);
    }
}

module.exports = BrowseFilterPanel;
