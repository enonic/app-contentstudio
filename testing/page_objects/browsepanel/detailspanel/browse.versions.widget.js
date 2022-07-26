/**
 * Created on 28/02/2020.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'VersionHistoryView')]",
    versionsList: "//ul[contains(@id,'VersionHistoryList')]",
    versionsListItem: "//li[contains(@class,'version-list-item') and child::div[not(contains(@class,'publish-action')) ] and not(descendant::h6[contains(.,'Permissions updated')])]",
    publishActionListItem: "//li[contains(@class,'version-list-item') and child::div[contains(@id,'VersionHistoryItemViewer') and contains(@class,'publish-action')]]",
    versionsSortedListItem: "//li[contains(@class,'version-list-item')and descendant::h6[contains(.,'Sorted')]]",
    versionsPermissionsUpdatedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Permissions updated')]]",
    versionsChangedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Changed')]]",
};

class BrowseVersionsWidget extends BaseVersionsWidget {

    get versionsWidget() {
        return XPATH.widget;
    }

    get versionItems() {
        return this.versionsWidget + XPATH.versionsList + XPATH.versionsListItem;
    }

    get publishActionItems() {
        return this.versionsWidget + XPATH.versionsList + XPATH.publishActionListItem;
    }

    //Gets items with headers - Sorted
    get sortedItems() {
        return this.versionsWidget + XPATH.versionsList + XPATH.versionsSortedListItem;
    }

    get permissionsUpdatedItems() {
        return this.versionsWidget + XPATH.versionsList + XPATH.versionsPermissionsUpdatedListItem;
    }

    get changedItems() {
        return this.versionsWidget + XPATH.versionsList + XPATH.versionsChangedListItem;
    }

    async getOwnerName() {
        let locator = XPATH.widget + XPATH.versionsListItem + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = BrowseVersionsWidget;
