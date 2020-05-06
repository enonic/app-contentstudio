/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: "//div[contains(@id,'ContentBrowseFilterPanel')]",
    clearFilterButton: "//a[contains(@id,'ClearFilterButton']",
    searchInput: "//input[contains(@id,'TextSearchField')]",
    dependenciesSection: "//div[contains(@id,'DependenciesSection')]",
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
        return this.waitForElementDisplayed(XPATH.container, appConst.TIMEOUT_3);
    }

    isPanelVisible() {
        return this.isElementDisplayed(XPATH.container);
    }

    waitForClearLinkDisplayed() {
        return this.waitForElementDisplayed(this.clearFilterLink, appConst.TIMEOUT_3)
    }

    waitForDependenciesSectionVisible() {
        return this.waitForElementDisplayed(XPATH.container + XPATH.dependenciesSection, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot("err_load_dependencies_section");
            throw new Error(" Filter Panel: Dependencies section should be visible! " + err);
        })
    }

    clickOnClearLink() {
        return this.clickOnElement(this.clearFilterLink)
    }
};
module.exports = BrowseFilterPanel;