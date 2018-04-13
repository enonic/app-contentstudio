/**
 * Created on 5/31/2017.
 */
const page = require('../page');
const saveBeforeCloseDialog = require('../save.before.close.dialog');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

var panel = {
    toolbar: `//div[contains(@id,'ContentBrowseToolbar')]`,
    treeGrid: `//div[contains(@id,'ContentTreeGrid')]`,
    searchButton: "//button[contains(@class, 'icon-search')]",
    showIssuesListButton: "//button[contains(@id,'ShowIssuesDialogButton')]",
    createIssueMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Create Issue...']",
    contentPublishMenuButton: `//div[contains(@id,'ContentPublishMenuButton')]`,
    contentSummaryByName: function (name) {
        return `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
    },
    checkboxByName: function (name) {
        return `${elements.itemByName(name)}` +
               `/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },
    checkboxByDisplayName: displayName => `${elements.itemByDisplayName(
        displayName)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`,

    expanderIconByName: function (name) {
        return elements.itemByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;

    },
}
var contentBrowsePanel = Object.create(page, {

    searchButton: {
        get: function () {
            return `${panel.toolbar}` + `${panel.searchButton}`;
        }
    },
    showPublishMenuButton: {
        get: function () {
            return `${panel.toolbar}` + `${panel.contentPublishMenuButton}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    createIssueMenuItem: {
        get: function () {
            return `${panel.toolbar}` + `${panel.createIssueMenuItem}`;
        }
    },
    showIssuesListButton: {
        get: function () {
            return `${panel.toolbar}` + `${panel.showIssuesListButton}`;
        }
    },
    newButton: {
        get: function () {
            return `${panel.toolbar}/*[contains(@id, 'ActionButton') and child::span[contains(.,'New...')]]`
        }
    },
    editButton: {
        get: function () {
            return `${panel.toolbar}/*[contains(@id, 'ActionButton') and child::span[text()='Edit']]`;
        }
    },

    deleteButton: {
        get: function () {
            return `${panel.toolbar}/*[contains(@id, 'ActionButton') and child::span[text()='Delete...']]`;
        }
    },
    moveButton: {
        get: function () {
            return `${panel.toolbar}/*[contains(@id, 'ActionButton') and child::span[text()='Move...']]`;
        }
    },
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    waitForPanelVisible: {
        value: function (ms) {
            return this.waitForVisible(`${panel.toolbar}`, ms).catch(err=> {
                throw new Error('Content browse panel was not loaded in ' + ms);
            });
        }
    },
    clickOnMoveButton: {
        value: function () {
            return this.doClick(this.moveButton).catch(err=> {
                throw new Error('error when clicking on the Move button ' + err);
            })
        }
    },
    clickOnShowIssuesListButton: {
        value: function () {
            return this.doClick(this.showIssuesListButton).catch(err=> {
                throw new Error('error when click on the button ' + err);
            })
        }
    },
    waitForContentDisplayed: {
        value: function (contentName) {
            return this.waitForVisible(`${panel.treeGrid}` + `${elements.itemByName(contentName)}`, appConst.TIMEOUT_3).catch((err)=> {
                console.log("item is not displayed:" + contentName);
                this.saveScreenshot('err_find_' + contentName)
                throw new Error('content not found! ' + contentName);
            });
        }
    },
    waitForItemNotDisplayed: {
        value: function (contentName) {
            return this.waitForNotVisible(`${panel.treeGrid}` + `${elements.itemByName(contentName)}`, appConst.TIMEOUT_3).catch((err)=> {
                console.log("content is still displayed:" + contentName);
                return false;
            });
        }
    },
    waitForGridLoaded: {
        value: function (ms) {
            return this.waitForVisible(`${elements.GRID_CANVAS}`, ms).then(()=> {
                return this.waitForSpinnerNotVisible(appConst.TIMEOUT_3);
            }).then(()=> {
                return console.log('content browse panel is loaded')
            }).catch(err=> {
                throw new Error('content browse panel was not loaded in ' + ms);
            });
        }
    },
    clickOnSearchButton: {
        value: function () {
            return this.doClick(this.searchButton);
        }
    },
    clickOnNewButton: {
        value: function () {
            return this.waitForEnabled(this.newButton, 1000).then(()=> {
                return this.doClick(this.newButton);
            }).catch((err)=> {
                throw new Error('New button is not enabled! ' + err);
            })
        }
    },
    clickOnEditButton: {
        value: function () {
            return this.waitForEnabled(this.editButton, 1000).then(()=> {
                return this.doClick(this.editButton);
            }).pause(500).catch((err)=> {
                this.saveScreenshot('err_browsepanel_edit');
                throw new Error('Edit button is not enabled! ' + err);
            })
        }
    },
    clickOnDeleteButton: {
        value: function () {
            return this.waitForEnabled(this.deleteButton, 2000).then(()=> {
                return this.doClick(this.deleteButton);
            }).catch((err)=> {
                this.saveScreenshot('err_browsepanel_delete');
                throw new Error('Delete button is not enabled! ' + err);
            })
        }
    },
    isSearchButtonDisplayed: {
        value: function () {
            return this.isVisible(this.searchButton);
        }
    },
    waitForNewButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.newButton, 3000).catch(err=> {
                this.saveScreenshot('err_new_button');
                return false;
            })
        }
    },
    waitForEditButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.editButton, 3000).catch(err=> {
                this.saveScreenshot('err_edit_button');
                throw Error('Edit button is not enabled after ' + 3000 + 'ms')
            })
        }
    },
    waitForDeleteButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.deleteButton, 3000).catch(err=> {
                this.saveScreenshot('err_delete_button');
                throw Error('Delete button is not enabled after ' + 3000 + 'ms')
            })
        }
    },
    waitForDeleteButtonDisabled: {
        value: function () {
            return this.waitForDisabled(this.deleteButton, 3000).catch(err=> {
                this.saveScreenshot('err_delete_disabled_button');
                throw Error('Delete button should be disabled, timeout: ' + 3000 + 'ms')
            })
        }
    },
    isDeleteButtonEnabled: {
        value: function () {
            return this.isEnabled(this.deleteButton).catch(err=> {
                this.saveScreenshot('err_delete_button');
                throw Error('Delete button should be enabled, timeout ' + 3000 + 'ms')
            })
        }
    },
    isNewButtonEnabled: {
        value: function () {
            return this.isEnabled(this.newButton);
        }
    },
    isEditButtonEnabled: {
        value: function () {
            return this.isEnabled(this.editButton);
        }
    },
    clickOnRowByName: {
        value: function (name) {
            var nameXpath = panel.treeGrid + elements.itemByName(name);
            return this.waitForVisible(nameXpath, 3000).then(()=> {
                return this.doClick(nameXpath);
            }).pause(400).catch((err)=> {
                this.saveScreenshot('err_find_' + name);
                throw Error('Row with the name ' + name + ' was not found')
            })
        }
    },
    clickOnRowByDisplayName: {
        value: function (displayName) {
            var nameXpath = panel.treeGrid + elements.itemByDisplayName(displayName);
            return this.waitForVisible(nameXpath, 3000).then(()=> {
                return this.doClick(nameXpath);
            }).pause(400).catch((err)=> {
                this.saveScreenshot('err_find_' + displayName);
                throw Error('Row with the displayName ' + displayName + ' was not found')
            })
        }
    },
    waitForRowByNameVisible: {
        value: function (name) {
            var nameXpath = panel.treeGrid + elements.itemByName(name);
            return this.waitForVisible(nameXpath, 3000)
                .catch((err)=> {
                    this.saveScreenshot('err_find_' + name);
                    throw Error('Row with the name ' + name + ' is not visible after ' + 3000 + 'ms')
                })
        }
    },
    waitForContentByDisplayNameVisible: {
        value: function (displayName) {
            var nameXpath = panel.treeGrid + elements.itemByDisplayName(displayName);
            return this.waitForVisible(nameXpath, 3000).catch((err)=> {
                this.saveScreenshot('err_find_' + displayName);
                throw Error('Content with the displayName ' + displayName + ' is not visible after ' + 3000 + 'ms')
                })
        }
    },
    clickCheckboxAndSelectRowByDisplayName: {
        value: function (displayName) {
            const displayNameXpath = panel.checkboxByDisplayName(displayName);
            return this.waitForVisible(displayNameXpath, 2000).then(() => {
                return this.doClick(displayNameXpath);
            }).catch((err) => {
                this.saveScreenshot('err_find_item');
                throw Error(`Row with the displayName ${displayName} was not found.`)
            })
        }
    },
    clickCheckboxAndSelectRowByName: {
        value: function (name) {
            var nameXpath = panel.checkboxByName(name);
            return this.waitForVisible(nameXpath, 2000).then(()=> {
                return this.doClick(nameXpath);
            }).catch((err)=> {
                this.saveScreenshot('err_find_item');
                throw Error('Row with the name ' + name + ' was not found')
            })
        }
    },
    doCloseWindowTabAndSwitchToBrowsePanel: {
        value: function (displayName) {
            return this.getBrowser().close().pause(300).then(()=> {
                return saveBeforeCloseDialog.isDialogPresent(100);
            }).then((result)=> {
                if (result) {
                    this.saveScreenshot('err_save_close_item').then(()=> {
                        console.log('save before close dialog must not be present');
                        throw new Error('`Save Before Close` dialog should not appear when try to close the ' + displayName);
                    });
                }
            }).then(()=> {
                return this.doSwitchToContentBrowsePanel();
            });
        }
    },
    clickOnExpanderIcon: {
        value: function (name) {
            var expanderIcon = panel.treeGrid + panel.expanderIconByName(name);
            return this.doClick(expanderIcon).pause(700).catch(err=> {
                this.saveScreenshot('err_click_on_expander ' + name);
                throw new Error('error when click on expander-icon ' + err);
            })
        }
    },
    // this method does not wait, it just checks the attribute
    isRedIconDisplayed: {
        value: function (contentName) {
            var xpath = panel.contentSummaryByName(contentName);
            return this.getBrowser().getAttribute(xpath, 'class').then(result=> {
                return result.includes('invalid');
            });
        }
    },
    // this method waits until 'invalid' appears in the @class
    waitForRedIconDisplayed: {
        value: function (contentName) {
            var xpath = panel.contentSummaryByName(contentName);
            return this.waitUntilInvalid(xpath);
        }
    },
    openShowPublishMenuAndClickOnCreateIssue: {
        value: function () {
            return this.doClick(this.showPublishMenuButton).then(()=> {
                return this.waitForVisible(this.createIssueMenuItem);
            }).then(()=> {
                return this.doClick(this.createIssueMenuItem);
            }).catch(err=> {
                this.saveScreenshot("err_click_create_issue_menuItem");
                throw new Error('error when try to click on Create Issue menu item, ' + err);
            })

        }
    }
});
module.exports = contentBrowsePanel;


