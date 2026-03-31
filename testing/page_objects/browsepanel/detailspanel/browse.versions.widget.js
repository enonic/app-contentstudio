/**
 * Created on 28/02/2020.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');

const XPATH = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'VersionHistoryView')]",
    versionsList: "//ul[contains(@id,'VersionHistoryList')]",
    versionsListItem: "//li[contains(@class,'version-list-item')]",
    editedListItem: "//li[contains(@class,'version-list-item') and child::div[not(contains(@class,'publish-action'))] and descendant::h6[contains(.,'Edited')]]",
    createdListItem: "//li[contains(@class,'version-list-item') and child::div[not(contains(@class,'publish-action'))] and descendant::h6[contains(.,'Created')]]",
    unpublishedListItem: "//li[contains(@class,'version-list-item') and child::div[contains(@class,'publish-action')] and descendant::h6[contains(.,'Unpublished')]]",
    publishedListItem: "//li[contains(@class,'version-list-item') and child::div[contains(@class,'publish-action')] and descendant::h6[contains(.,'Published')]]",
    sortedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Sorted')]]",
    permissionsUpdatedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Permissions updated')]]",
    markedAsReadyListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Marked as Ready')]]",
    movedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Moved')]]",
    renamedListItem: "//li[contains(@class,'version-list-item') and descendant::h6[contains(.,'Renamed')]]",
};

class BrowseVersionsWidget extends BaseVersionsWidget {

    constructor() {
        super();
        this._parentElement = "//div[contains(@id,'ContentBrowsePanel')]";
    }
}

module.exports = BrowseVersionsWidget;
