/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const XPATH = {
    container: "//div[contains(@id,'ContentBrowseFilterPanel')]",
    clearFilterButton: "//a[contains(@id,'ClearFilterButton']",
    searchInput: "//input[contains(@id,'TextSearchField')]",
    dependenciesSection: "//div[contains(@id,'DependenciesSection')]",
    aggregationContainer: "//div[contains(@id,'AggregationContainer')]//div[contains(@id,'ContentTypeAggregationGroupView')]",
    aggregationLabelByName: name => XPATH.aggregationContainer +
                                    `//div[contains(@class,'checkbox') and child::label[contains(.,'${name}')]]//label`,
    aggregationCheckboxByName: name => XPATH.aggregationContainer +
                                       `//div[contains(@class,'checkbox') and child::label[contains(.,'${name}')]]` + lib.CHECKBOX_INPUT,
};

class BrowseFilterPanel extends Page {

    get clearFilterLink() {
        return XPATH.container + XPATH.clearFilterButton;
    }

    get searchTextInput() {
        return XPATH.container + XPATH.searchInput;
    }

    async typeSearchText(text) {
        try {
            return await this.typeTextInInput(this.searchTextInput, text);
        } catch (err) {
            throw new Error("Error when type text in Search Input " + err);
        }
    }

    waitForOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
    }

    isPanelVisible() {
        return this.isElementDisplayed(XPATH.container);
    }

    waitForClearLinkDisplayed() {
        return this.waitForElementDisplayed(this.clearFilterLink, appConst.mediumTimeout)
    }

    waitForDependenciesSectionVisible() {
        return this.waitForElementDisplayed(XPATH.container + XPATH.dependenciesSection, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot("err_load_dependencies_section");
            throw new Error(" Filter Panel: Dependencies section should be visible! " + err);
        })
    }

    clickOnClearLink() {
        return this.clickOnElement(this.clearFilterLink)
    }

    async clickOnCheckboxInAggregationView(contentType) {
        let selector = XPATH.aggregationLabelByName(contentType);
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        await this.clickOnElement(selector);
        return await this.pause(1000);
    }

    async getNumberOfItemsInAggregationView(contentType) {
        let locator = XPATH.aggregationLabelByName(contentType);
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        let label = await this.getText(locator);
        let startIndex = label.indexOf('(');
        let endIndex = label.indexOf(')');
        return label.substring(startIndex + 1, endIndex);
    }
}

module.exports = BrowseFilterPanel;
