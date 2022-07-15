/**
 * Created on 28/02/2020.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'VersionHistoryView')]",
    versionsList: "//ul[contains(@id,'VersionHistoryList')]",
    versionItem: "//li[contains(@class,'version-list-item') and child::div[contains(@class,'version-viewer')] and not(descendant::h6[contains(.,'Permissions updated')])]",
    publishActionItems: "//li[contains(@class,'version-list-item')and child::div[contains(@class,'publish-action')]]",
};

class BrowseVersionsWidget extends BaseVersionsWidget {

    get versionsWidget() {
        return XPATH.widget;
    }

    get versionItems() {
        return this.versionsWidget + XPATH.versionsList + XPATH.versionItem;
    }

    get publishActionItems() {
        return this.versionsWidget + XPATH.versionsList + XPATH.publishActionItems;
    }

    async getOwnerName() {
        let locator = XPATH.widget + XPATH.versionItem + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = BrowseVersionsWidget;
