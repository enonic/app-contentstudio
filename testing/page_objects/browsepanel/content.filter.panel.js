/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const XPATH = {
    container: "//div[contains(@id,'ContentBrowseFilterPanel')]",
    clearFilterLink: "//a[contains(@id,'ClearFilterButton')]",
    searchInput: "//input[contains(@id,'TextSearchField')]",
    dependenciesSection: "//div[contains(@id,'DependenciesSection')]",
    showResultsButton: "//div[contains(@class,'show-filter-results')]",
    contentTypeAggregationGroup: `//div[contains(@id,'AggregationContainer')]//div[contains(@id,'ContentTypeAggregationGroupView') and child::h2['Content Types']]`,
    aggregationGroupByName: name => `//div[contains(@id,'AggregationContainer')]//div[contains(@id,'AggregationGroupView') and child::h2['${name}']]`,
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

    get showResultsButton() {
        return XPATH.container + XPATH.showResultsButton;
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
            throw new Error("Error when type text in Search Input " + err);
        }
    }

    waitForOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
    }

    waitForShowResultsButtonDisplayed() {
        return this.waitForElementDisplayed(this.showResultsButton, appConst.mediumTimeout);
    }

    async clickOnShowResultsButton() {
        await this.waitForShowResultsButtonDisplayed();
        return await this.clickOnElement(this.showResultsButton);
    }

    waitForCloseDependenciesSectionButtonDisplayed() {
        return this.waitForElementDisplayed(this.closeDependenciesSectionButtonLocator, appConst.mediumTimeout);
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
            await this.saveScreenshot(appConst.generateRandomName("err_load_dependencies_section"));
            throw new Error("Filter Panel: Dependencies section should be visible! " + err);
        }
    }

    async clickOnClearLink() {
        await this.waitForClearLinkDisplayed();
        return await this.clickOnElement(this.clearFilterLink)
    }

    //clicks on a checkbox in Content Types aggregation block
    async clickOnCheckboxInContentTypesBlock(contentType) {
        let selector = XPATH.contentTypeAggregationGroup + XPATH.aggregationLabelByName(contentType);
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        await this.clickOnElement(selector);
        return await this.pause(1200);
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

    // gets a number of items from a checkbox label in an aggregation block(Workflow,modifier)
    async getNumberOfItemsInAggregationView(blockName, checkboxLabel) {
        try {
            let locator = XPATH.aggregationGroupByName(blockName) + XPATH.aggregationLabelByName(checkboxLabel);
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            let label = await this.getText(locator);
            let startIndex = label.indexOf('(');
            let endIndex = label.indexOf(')');
            return label.substring(startIndex + 1, endIndex);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_numb_in_aggregation"));
            throw new Error("Error when get the number in aggregation checkbox: " + err);
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
        let locator = XPATH.contentTypeAggregationGroup + "//div[contains(@class,'checkbox')]//label";
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
}

module.exports = BrowseFilterPanel;
