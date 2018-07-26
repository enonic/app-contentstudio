/**
 * Created on 1.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const panel = {
    container: "//div[contains(@id,'ContentBrowseFilterPanel')]",
    clearFilterButton: "//a[contains(@id,'ClearFilterButton']",
    searchInput: "//input[contains(@id,'browse.filter.TextSearchField')]"
};
const browseFilterPanel = Object.create(page, {

    clearFilterLink: {
        get: function () {
            return `${panel.container}` + `${panel.clearFilterButton}`;
        }
    },
    searchTextInput: {
        get: function () {
            return `${panel.container}` + `${panel.searchInput}`;
        }
    },
    typeSearchText: {
        value: function (text) {
            return this.typeTextInInput(this.searchTextInput, text);
        }
    },
    waitForOpened: {
        value: function () {
            return this.waitForVisible(`${panel.container}`, 3000);

        }
    },
    isPanelVisible: {
        value: function () {
            return this.isVisible(`${panel.container}`);

        }
    },
    waitForClearLinkVisible: {
        value: function () {
            return this.waitForVisible(this.clearFilterLink)
        }
    },
    clickOnClearLink: {
        value: function () {
            return this.doClick(this.clearFilterLink)
        }
    }
});
module.exports = browseFilterPanel;
