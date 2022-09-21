/**
 * Created on 30/07/2018.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');

const xpath = {
    widget: "//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'VersionHistoryView')]",
    versionsList: "//ul[contains(@id,'VersionHistoryList')]",
    versionsListItem: "//li[contains(@class,'version-list-item')]",
    editedListItem: "//li[contains(@class,'version-list-item') and child::div[not(contains(@class,'publish-action'))] and descendant::h6[contains(.,'Edited')]]",
    createdListItem: "//li[contains(@class,'version-list-item') and child::div[not(contains(@class,'publish-action'))] and descendant::h6[contains(.,'Created')]]",
    unpublishedListItem: "//li[contains(@class,'version-list-item') and child::div[contains(@class,'publish-action')] and descendant::h6[contains(.,'Unpublished')]]",
    publishedListItem: "//li[contains(@class,'version-list-item') and child::div[contains(@class,'publish-action')] and descendant::h6[contains(.,'Published')]]",
    sortedListItem: "//li[contains(@class,'version-list-item')and descendant::h6[contains(.,'Sorted')]]",
    permissionsUpdatedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Permissions updated')]]",
    markedAsReadyListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Marked as Ready')]]",
    movedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Moved')]]",
};

class WizardVersionsWidget extends BaseVersionsWidget {

    get versionsWidget() {
        return xpath.widget;
    }

    //Gets items with all headers - Edited, Sorted, Marked as Ready,Created...
    get versionItems() {
        return this.versionsWidget + xpath.versionsList + xpath.versionsListItem;
    }

    get publishedItems() {
        return this.versionsWidget + xpath.versionsList + xpath.publishedListItem;
    }

    get markedAsReadyItems() {
        return this.versionsWidget + xpath.versionsList + xpath.markedAsReadyListItem;
    }

    get unpublishedItems() {
        return this.versionsWidget + xpath.versionsList + xpath.unpublishedListItem;
    }

    //Gets items with headers - Sorted
    get sortedItems() {
        return this.versionsWidget + xpath.versionsList + xpath.sortedListItem;
    }

    get editedItems() {
        return this.versionsWidget + xpath.versionsList + xpath.editedListItem;
    }

    get createdItems() {
        return this.versionsWidget + xpath.versionsList + xpath.createdListItem;
    }

    get permissionsUpdatedItems() {
        return this.versionsWidget + xpath.versionsList + xpath.permissionsUpdatedListItem;
    }

    get movedItems() {
        return this.versionsWidget + xpath.versionsList + xpath.movedListItem;
    }
}

module.exports = WizardVersionsWidget;
