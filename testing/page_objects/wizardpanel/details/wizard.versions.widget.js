/**
 * Created on 30/07/2018.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');

const xpath = {
    widget: "//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'VersionHistoryView')]",
    versionsList: "//ul[contains(@id,'VersionHistoryList')]",
    versionsListItem: "//li[contains(@class,'version-list-item') and child::div[not(contains(@class,'publish-action')) ] and not(descendant::h6[contains(.,'Permissions updated')]) and not(descendant::h6[contains(.,'Changed')])]",
    publishActionListItem: "//li[contains(@class,'version-list-item') and child::div[contains(@id,'VersionHistoryItemViewer') and contains(@class,'publish-action')]]",
    versionsSortedListItem: "//li[contains(@class,'version-list-item')and descendant::h6[contains(.,'Sorted')]]",
    versionsPermissionsUpdatedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Permissions updated')]]",
    versionsChangedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Changed')]]",
};

class WizardVersionsWidget extends BaseVersionsWidget {

    get versionsWidget() {
        return xpath.widget;
    }

    //Gets items with headers - Edited, Sorted, Marked as Ready,Created
    get versionItems() {
        return this.versionsWidget + xpath.versionsList + xpath.versionsListItem;
    }

    //Gets items with headers - Published, Unpublished
    get publishActionItems() {
        return this.versionsWidget + xpath.versionsList + xpath.publishActionListItem;
    }

    //Gets items with headers - Sorted
    get sortedItems() {
        return this.versionsWidget + xpath.versionsList + xpath.versionsSortedListItem;
    }

    get permissionsUpdatedItems() {
        return this.versionsWidget + xpath.versionsList + xpath.versionsPermissionsUpdatedListItem;
    }

    get changedItems() {
        return this.versionsWidget + xpath.versionsList + xpath.versionsChangedListItem;
    }
}

module.exports = WizardVersionsWidget;
