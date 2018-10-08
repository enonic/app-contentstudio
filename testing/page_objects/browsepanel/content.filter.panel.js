/**
 * Created on 1.12.2017.
 */

const page = require('../page');
const appConst = require('../../libs/app_const');
const panel = {
    container: "//div[contains(@id,'ContentBrowseFilterPanel')]",
    clearFilterButton: "//a[contains(@id,'ClearFilterButton']",
    searchInput: "//input[contains(@id,'browse.filter.TextSearchField')]",
    dependenciesSection: "//div[contains(@id,'DependenciesSection')]",
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
            return this.waitForVisible(`${panel.container}`, appConst.TIMEOUT_3);

        }
    },
    isPanelVisible: {
        value: function () {
            return this.isVisible(`${panel.container}`);

        }
    },
    waitForClearLinkVisible: {
        value: function () {
            return this.waitForVisible(this.clearFilterLink, appConst.TIMEOUT_3)
        }
    },
    waitForDependenciesSectionVisible: {
        value: function () {
            return this.waitForVisible(panel.container + panel.dependenciesSection, appConst.TIMEOUT_3).catch(err => {
                this.saveScreenshot("err_load_dependencies_section");
                throw new Error(" Filter Panel: Dependencies section should be visible! " + err);
            })
        }
    },
    clickOnClearLink: {
        value: function () {
            return this.doClick(this.clearFilterLink)
        }
    }
});
module.exports = browseFilterPanel;
