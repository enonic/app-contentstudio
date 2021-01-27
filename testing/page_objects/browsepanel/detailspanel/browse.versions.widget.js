/**
 * Created on 28/02/2020.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');

const XPATH = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'VersionHistoryView')]",
    versionsList: "//ul[contains(@id,'VersionHistoryList')]",
    versionItem: "//li[contains(@class,'version-list-item') and child::div[@class='viewer version-viewer']]",
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
}

module.exports = BrowseVersionsWidget;
