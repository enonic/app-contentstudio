/**
 * Created on 10.04.2020.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const xpath = {
    container: "//div[contains(@id,'PrincipalBrowseFilterPanel')]",
    clearFilterButton: "//a[contains(@id,'ClearFilterButton')]",
    searchInput: "//input[contains(@id,'TextSearchField')]",
    aggregationGroupView: "//div[contains(@id,'AggregationContainer')]",
    userAggregationCheckbox: "//div[contains(@id,'Checkbox') and child::label[contains(.,'User (')]]",
    roleAggregationCheckbox: "//div[contains(@id,'Checkbox') and child::label[contains(.,'Role (')]]",
    idProviderAggregationCheckbox: "//div[contains(@id,'Checkbox') and child::label[contains(.,'Id Provider (')]]",
    userAggregationItems: "//div[contains(@id,'BucketView')]//div[contains(@id,'Checkbox') ]/label",
};

class PrincipalFilterPanel extends Page {

    get clearFilterLink() {
        return xpath.container + xpath.clearFilterButton;
    }

    get searchTextInput() {
        return xpath.container + xpath.searchInput;
    }

    getNumberAggregatedUsers() {
        let userSelector = xpath.container + xpath.aggregationGroupView + xpath.userAggregationCheckbox + `/label`;
        return this.getText(userSelector);
    }

    getNumberAggregatedRoles() {
        let userSelector = xpath.container + xpath.aggregationGroupView + xpath.roleAggregationCheckbox + `/label`;
        return this.getText(userSelector).then(result => {
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        });
    }

    getAggregationItems() {
        let selector = xpath.container + xpath.aggregationGroupView + xpath.userAggregationItems;
        return this.getTextInElements(selector);
    }

    clickOnUserAggregation() {
        let selector = xpath.container + xpath.aggregationGroupView + xpath.userAggregationCheckbox + '/label';
        return this.clickOnElement(selector);
    }

    async clickOnRoleAggregation() {
        let selector = xpath.container + xpath.aggregationGroupView + xpath.roleAggregationCheckbox + '/label';
        await this.clickOnElement(selector);
    }

    async clickOnIdProviderAggregation() {
        let selector = xpath.container + xpath.aggregationGroupView + xpath.idProviderAggregationCheckbox + '/label';
        await this.clickOnElement(selector);
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.userAggregationCheckbox, appConst.mediumTimeout);
    }

    waitForClosed() {
        return this.waitUntilElementNotVisible(xpath.userAggregationCheckbox, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_filter_panel_not_closed');
            throw new Error('Filter Panel was not closed');
        })
    }

    typeSearchText(text) {
        return this.typeTextInInput(this.searchTextInput, text).catch(err => {
            throw new Error("Filter Panel - " + err);
        })
    }

    waitForClearLinkVisible() {
        return this.waitForElementDisplayed(this.clearFilterLink, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_clear_link_filter_panel');
            throw new Error('Clear link should be visible: ' + err);
        })
    }

    waitForClearLinkNotVisible() {
        return this.waitUntilElementNotVisible(this.clearFilterLink, appConst.shortTimeout);
    }

    clickOnClearLink() {
        return this.clickOnElement(this.clearFilterLink);
    }

    isPanelVisible() {
        return this.isElementDisplayed(xpath.container);
    }
}

module.exports = PrincipalFilterPanel;

