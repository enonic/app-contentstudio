/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const XPATH = {
    container: "//div[contains(@id,'ContentBrowseFilterPanel')]",
    hitsAndClearDiv: "//div[contains(@class,'hits-and-clear')]",
    clearFilterLink: "//a[contains(@id,'ClearFilterButton')]",
    searchInput: "//input[contains(@id,'TextSearchField')]",
    dependenciesSection: "//div[contains(@id,'DependenciesSection')]",
    showResultsButton: "//span[contains(@class,'show-filter-results')]",
    showMoreButton: "//button[child::span[text()='Show more']]",
    showLessButton: "//button[child::span[text()='Show less']]",
    selectorOptionCheckbox: "//ul[contains(@id,'BucketListBox')]//div[contains(@id,'Checkbox')]",
    selectorOptionItem: "//ul[contains(@id,'BucketListBox')]//div[contains(@class,'item-view-wrapper')]",
    selectorOptionItemByLabel: label => `//ul[contains(@id,'BucketListBox')]//div[contains(@class,'item-view-wrapper') and descendant::h6[contains(@class,'main-name') and contains(.,'${label}')]]`,
    ownerAggregationGroupView: "//div[contains(@id,'FilterableAggregationGroupView') and child::h2[text()='Owner']]",
    aggregationListBoxDropdown: label => `//div[contains(@id,'FilterableAggregationGroupView') and child::h2[text()='${label}']]//div[contains(@id,'SelectableListBoxDropdown')]`,
    aggregationGroupByName: name => `//div[contains(@id,'AggregationContainer')]//div[contains(@id,'AggregationGroupView') and child::h2[text()='${name}']]`,
    aggregationLabelByName: name => `//div[contains(@class,'checkbox') and child::label[contains(.,'${name}')]]//label`,
    folderAggregation: () => `//div[contains(@class,'checkbox') and child::label[contains(.,'Folder') and not(contains(.,'Template'))]]//label`,
    aggregationCheckboxByName: name => `//div[contains(@class,'checkbox') and child::label[contains(.,'${name}')]]` + lib.CHECKBOX_INPUT,
    lastModifiedAggregationEntry:
        time => `//div[@class='aggregation-group-view']/h2[text()='Last Modified']/..//div[contains(@class,'checkbox') and child::label]//label[contains(.,'${time}')]`,
};

class BrowseFilterPanel extends Page {

    get clearFilterLink() {
        return XPATH.container + XPATH.clearFilterLink;
    }

    get exportButton() {
        return XPATH.container + XPATH.hitsAndClearDiv + "//span[contains(@id,'ContentExportElement')]";
    }

    get showResultsButton() {
        return XPATH.container + XPATH.showResultsButton;
    }

    get showMoreButton() {
        return XPATH.container + "//div[contains(@id,'AggregationGroupView') and child::h2[text()='Content Types']]" + XPATH.showMoreButton;
    }

    get showLessButton() {
        return XPATH.container + "//div[contains(@id,'AggregationGroupView') and child::h2[text()='Content Types']]" + XPATH.showLessButton;
    }

    get ownerDropdownHandle() {
        return XPATH.aggregationListBoxDropdown('Owner') + lib.DROP_DOWN_HANDLE;
    }

    get lastModifiedByDropdownHandle() {
        return XPATH.aggregationListBoxDropdown('Last Modified By') + lib.DROP_DOWN_HANDLE;
    }

    get closeDependenciesSectionButtonLocator() {
        return XPATH.dependenciesSection + "//button[contains(@class,'btn-close')]";
    }

    get searchTextInput() {
        return XPATH.container + XPATH.searchInput;
    }

    waitForLastModifiedByDropdownHandleDisplayed() {
        return this.waitForElementDisplayed(this.lastModifiedByDropdownHandle, appConst.mediumTimeout);
    }

    waitForOwnerDropdownHandleDisplayed() {
        return this.waitForElementDisplayed(this.ownerDropdownHandle, appConst.mediumTimeout);
    }

    async clickOnOwnerDropdownHandle() {
        await this.waitForOwnerDropdownHandleDisplayed();
        await this.clickOnElement(this.ownerDropdownHandle);
        await this.pause(500);
    }

    async clickOnLastModifiedByDropdownHandle() {
        await this.waitForLastModifiedByDropdownHandleDisplayed();
        return await this.clickOnElement(this.lastModifiedByDropdownHandle);
    }

    async typeSearchText(text) {
        try {
            await this.typeTextInInput(this.searchTextInput, text);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_filter_input');
            throw new Error("Error when type text in Search Input, screenshot: " + screenshot + ' ' + err);
        }
    }

    async waitForExportButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.exportButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_export_btn');
            throw new Error("Error - Export button should be displayed, screenshot: " + screenshot + ' ' + err);
        }
    }

    async waitForExportButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.exportButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_export_btn');
            throw new Error("Error - Export button should not be displayed, screenshot: " + screenshot + ' ' + err);
        }
    }

    async waitForExportButtonDisabled() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getAttribute(this.exportButton, "class");
                return text.includes('disabled');
            }, {timeout: appConst.shortTimeout, timeoutMsg: "'Export' button should be disabled"});
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_export_btn');
            throw new Error("Error - Export button should be disabled, screenshot: " + screenshot + ' ' + err);
        }
    }

    async waitForExportButtonEnabled() {
        try {
            await this.waitForExportButtonDisplayed();
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getAttribute(this.exportButton, "class");
                return !text.includes('disabled');
            }, {timeout: appConst.shortTimeout, timeoutMsg: "'Export' button should be enabled"});
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_export_btn');
            throw new Error("Error - Export button should be enabled, screenshot: " + screenshot + ' ' + err);
        }
    }

    async clickOnExportButton() {
        await this.waitForExportButtonEnabled();
        await this.clickOnElement(this.exportButton);
    }

    async waitForOpened() {
        await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        await this.pause(300);
    }

    waitForShowResultsButtonDisplayed() {
        return this.waitForElementDisplayed(this.showResultsButton, appConst.mediumTimeout);
    }

    waitForShowMoreButtonDisplayed() {
        return this.waitForElementDisplayed(this.showMoreButton, appConst.shortTimeout);
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

    async clickOnShowResultsButton() {
        try {
            await this.waitForShowResultsButtonDisplayed();
            return await this.clickOnElement(this.showResultsButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_results_button');
            throw new Error("Error when click on Show Results button, screenshot: " + screenshot + ' ' + err);
        }
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

    async waitForDependenciesSectionVisible(ms) {
        try {
            let timeout;
            timeout = ms === undefined ? appConst.mediumTimeout : ms;
            return await this.waitForElementDisplayed(XPATH.container + XPATH.dependenciesSection, timeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_load_dependencies_section');
            throw new Error("Filter Panel: Dependencies section should be visible! screenshot " + screenshot + ' ' + err);
        }
    }

    async clickOnClearLink() {
        await this.waitForClearLinkDisplayed();
        await this.clickOnElement(this.clearFilterLink)
        await this.pause(1000);
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
            return await this.pause(1200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_content_types_filtering');
            throw new Error("Error, checkbox in Content Types aggregation block, screenshot " + screenshot + ' ' + err);
        }
    }

    async waitForCheckboxDisplayed(blockName, label) {
        let selector = XPATH.aggregationGroupByName(blockName) + XPATH.aggregationLabelByName(label);
        return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
    }

    async waitForAggregationGroupDisplayed(blockName) {
        let selector = XPATH.aggregationGroupByName(blockName);
        return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
    }

    async waitForCheckboxNotDisplayed(blockName, checkBoxLabel) {
        let selector = XPATH.aggregationGroupByName(blockName) + XPATH.aggregationLabelByName(checkBoxLabel);
        return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
    }

    //clicks on a checkbox in Workflow aggregation block
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
            let screenshot = await this.saveScreenshotUniqueName('err_numb_in_aggregation');
            throw new Error('Error, get the number in aggregation checkbox, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getNumberOfItemsInFolderAggregation() {
        let locator = XPATH.folderAggregation();
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        let label = await this.getText(locator);
        let startIndex = label.indexOf('(');
        let endIndex = label.indexOf(')');
        return label.substring(startIndex + 1, endIndex);
    }

    //Gets items in "Content Types" block:
    async geContentTypes() {
        let locator = XPATH.aggregationGroupByName('Content Types') + "//div[contains(@class,'checkbox')]//label";
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async getLastModifiedCount(timestamp) {
        let locator = XPATH.lastModifiedAggregationEntry(timestamp);
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        let label = await this.getText(locator);
        let startIndex = label.indexOf('(');
        let endIndex = label.indexOf(')');
        return label.substring(startIndex + 1, endIndex);
    }

    async getOwnerNameInSelector() {
        let owners = [];
        let optionsLocator = XPATH.ownerAggregationGroupView + XPATH.selectorOptionItem + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(optionsLocator, appConst.shortTimeout);
        let result = await this.getTextInDisplayedElements(optionsLocator);
        result.map(item => {
            let value = item.substring(0, item.indexOf('('));
            owners.push(value.trim());
        })
        return owners;
    }

    async expandOwnerOptionsAndSelectItem(ownerName) {
        try {
            await this.clickOnOwnerDropdownHandle();
            let checkboxLocator = XPATH.ownerAggregationGroupView + XPATH.selectorOptionItemByLabel(ownerName);
            await this.waitForElementDisplayed(checkboxLocator, appConst.mediumTimeout);
            await this.clickOnElement(checkboxLocator);
            let okButton = XPATH.ownerAggregationGroupView + "//button[child::span[text()='OK']]";
            await this.waitForElementDisplayed(okButton, appConst.mediumTimeout);
            await this.clickOnElement(okButton);
            await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_filter_owner');
            throw new Error("Error when selecting an option in 'Owner Selector', screenshot: " + screenshot + ' ' + err);
        }
    }
}

module.exports = BrowseFilterPanel;
