/**
 * Created on 28/02/2020.
 */
const BaseVersionsWidget = require('../../details_panel/base.versions.widget');

const XPATH = {
    widget: `//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'VersionsWidgetItemView')]`,
    versionsList: `//ul[contains(@id,'VersionsView')]`,
    versionItem: `//li[contains(@class,'content-version-item')]`,
};

class BrowseVersionsWidget extends BaseVersionsWidget {

    get versionsWidget() {
        return XPATH.widget;
    }

    get versionItems() {
        return this.versionsWidget + XPATH.versionsList + XPATH.versionItem;
    }
};
module.exports = BrowseVersionsWidget;
