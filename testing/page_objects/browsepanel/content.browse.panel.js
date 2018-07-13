/**
 * Created on 5/31/2017.
 */
const page = require('../page');
const saveBeforeCloseDialog = require('../save.before.close.dialog');
const contentDuplicateDialog = require('../content.duplicate.dialog');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const panel = {
    container: "//div[contains(@id,'ContentBrowsePanel')]",
    toolbar: `//div[contains(@id,'ContentBrowseToolbar')]`,
    treeGridToolbar: `//div[contains(@id,'ContentTreeGridToolbar')]`,
    treeGrid: `//div[contains(@id,'ContentTreeGrid')]`,
    appBar: `//div[contains(@id,'AppBar')]`,
    selectedRows: `//div[@class='slick-viewport']//div[contains(@class,'slick-row') and contains(@class,'selected')]`,
    checkedRows: `//div[@class='slick-viewport']//div[contains(@class,'slick-cell-checkboxsel selected')]`,
    searchButton: "//button[contains(@class, 'icon-search')]",
    showIssuesListButton: "//button[contains(@id,'ShowIssuesDialogButton')]",
    createIssueMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Create Issue...']",
    contentPublishMenuButton: `//div[contains(@id,'ContentPublishMenuButton')]`,
    selectionControllerCheckBox: `//div[contains(@id,'SelectionController')]`,
    selectionPanelToggler: `//button[contains(@id,'SelectionPanelToggler')]`,
    numberInSelectionToggler: `//button[contains(@id,'SelectionPanelToggler')]/span`,
    duplicateButton: `/button[contains(@id,'ActionButton') and child::span[contains(.,'Duplicate...')]]`,
    detailsPanelToggleButton: `//button[contains(@id,'NonMobileDetailsPanelToggleButton')]`,
    contentSummaryByName: function (name) {
        return `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
    },
    rowByDisplayName:
        displayName => `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,

    checkboxByName: function (name) {
        return `${elements.itemByName(
            name)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },
    checkboxByDisplayName: displayName => `${elements.itemByDisplayName(
        displayName)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`,

    expanderIconByName: function (name) {
        return elements.itemByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;

    },
}
const contentBrowsePanel = Object.create(page, {

    searchButton: {
        get: function () {
            return `${panel.toolbar}` + `${panel.searchButton}`;
        }
    },
    detailsPanelToggleButton: {
        get: function () {
            return `${panel.container}` + `${panel.detailsPanelToggleButton}`;
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
            return `${panel.appBar}` + `${panel.showIssuesListButton}`;
        }
    },
    selectionControllerCheckBox: {
        get: function () {
            return `${panel.treeGridToolbar}${panel.selectionControllerCheckBox}`;
        }
    },
    numberInToggler: {
        get: function () {
            return `${panel.treeGridToolbar}${panel.numberInSelectionToggler}`;
        }
    },
    selectionPanelToggler: {
        get: function () {
            return `${panel.treeGridToolbar}${panel.selectionPanelToggler}`;
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
    duplicateButton: {
        get: function () {
            return `${panel.toolbar}` + panel.duplicateButton;
        }
    },
    previewButton: {
        get: function () {
            return `${panel.toolbar}/*[contains(@id, 'ActionButton') and child::span[contains(.,'Preview')]]`
        }
    },
    publishButton: {
        get: function () {
            return `${panel.toolbar}//button[contains(@id, 'ActionButton') and child::span[contains(.,'Publish...')]]`
        }
    },

    clickOnDetailsPanelToggleButton: {
        value: function () {
            return this.doClick(this.detailsPanelToggleButton).catch(err => {
                this.saveScreenshot('err_click_on_details_panel_toggle');
                throw new Error(`Error when clicking on Details Panel toggler` + err);
            });
        }
    },
    clickOnSelectionControllerCheckbox: {
        value: function () {
            return this.doClick(this.selectionControllerCheckBox).catch(() => {
                this.saveScreenshot('err_click_on_selection_controller');
                throw new Error(`Error when clicking on Selection controller`);
            });
        }
    },
    waitForSelectionTogglerVisible: {
        value: function () {
            return this.waitForVisible(this.selectionPanelToggler, appConst.TIMEOUT_2).then(() => {
                return this.getAttribute(this.selectionPanelToggler, 'class');
            }).then(result => {
                return result.includes('any-selected');
            }).catch(err => {
                console.log(`error when check the 'Selection toggler'` + err);
                return false;
            });
        }
    },
    waitForPanelVisible: {
        value: function (ms) {
            return this.waitForVisible(`${panel.toolbar}`, ms).catch(err => {
                throw new Error('Content browse panel was not loaded in ' + ms);
            });
        }
    },
    clickOnMoveButton: {
        value: function () {
            return this.doClick(this.moveButton).catch(err => {
                throw new Error('error when clicking on the Move button ' + err);
            })
        }
    },
    clickOnPublishButton: {
        value: function () {
            return this.doClick(this.publishButton).catch(err => {
                throw new Error('error when clicking on the Publish button ' + err);
            })
        }
    },

    clickOnDuplicateButton: {
        value: function () {
            return this.doClick(this.duplicateButton).catch(err => {
                throw new Error('error when clicking on the Duplicate button ' + err);
            })
        }
    },
    clickOnDuplicateButtonAndWait: {
        value: function () {
            return this.doClick(this.duplicateButton).then(() => {
                return contentDuplicateDialog.waitForDialogVisible();
            }).catch(err => {
                throw new Error('error when clicking on the Duplicate button ' + err);
            })
        }
    },
    clickOnShowIssuesListButton: {
        value: function () {
            return this.doClick(this.showIssuesListButton).catch(err => {
                throw new Error('error when click on the button ' + err);
            })
        }
    },
    waitForContentDisplayed: {
        value: function (contentName) {
            return this.waitForVisible(`${panel.treeGrid}` + `${elements.itemByName(contentName)}`, appConst.TIMEOUT_3).catch((err) => {
                console.log("item is not displayed:" + contentName);
                this.saveScreenshot('err_find_' + contentName)
                throw new Error('content not found! ' + contentName);
            });
        }
    },
    waitForItemNotDisplayed: {
        value: function (contentName) {
            return this.waitForNotVisible(`${panel.treeGrid}` + `${elements.itemByName(contentName)}`, appConst.TIMEOUT_3).catch((err) => {
                console.log("content is still displayed:" + contentName);
                return false;
            });
        }
    },
    waitForGridLoaded: {
        value: function (ms) {
            return this.waitForVisible(`${elements.GRID_CANVAS}`, ms).then(() => {
                return this.waitForSpinnerNotVisible(appConst.TIMEOUT_5);
            }).then(() => {
                return console.log('content browse panel is loaded')
            }).catch(err => {
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
            return this.waitForEnabled(this.newButton, 1000).then(() => {
                return this.doClick(this.newButton);
            }).catch((err) => {
                throw new Error('New button is not enabled! ' + err);
            })
        }
    },
    clickOnEditButton: {
        value: function () {
            return this.waitForEnabled(this.editButton, 1000).then(() => {
                return this.doClick(this.editButton);
            }).pause(500).catch((err) => {
                this.saveScreenshot('err_browsepanel_edit');
                throw new Error('Edit button is not enabled! ' + err);
            })
        }
    },
    clickOnDeleteButton: {
        value: function () {
            return this.waitForEnabled(this.deleteButton, 2000).then(() => {
                return this.doClick(this.deleteButton);
            }).catch((err) => {
                this.saveScreenshot('err_browsepanel_delete');
                throw new Error('Delete button is not enabled! ' + err);
            })
        }
    },
    clickOnPreviewButton: {
        value: function () {
            return this.waitForEnabled(this.previewButton, 2000).then(() => {
                return this.doClick(this.previewButton);
            }).catch((err) => {
                this.saveScreenshot('err_browsepanel_preview');
                throw new Error('Error when clicking on Preview button ' + err);
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
            return this.waitForEnabled(this.newButton, 3000).catch(err => {
                this.saveScreenshot('err_new_button');
                return false;
            })
        }
    },
    waitForEditButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.editButton, 3000).catch(err => {
                this.saveScreenshot('err_edit_button');
                throw Error('Edit button is not enabled after ' + 3000 + 'ms')
            })
        }
    },
    waitForDeleteButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.deleteButton, 3000).catch(err => {
                this.saveScreenshot('err_delete_button');
                throw Error('Delete button is not enabled after ' + 3000 + 'ms')
            })
        }
    },
    waitForDeleteButtonDisabled: {
        value: function () {
            return this.waitForDisabled(this.deleteButton, 3000).catch(err => {
                this.saveScreenshot('err_delete_disabled_button');
                throw Error('Delete button should be disabled, timeout: ' + 3000 + 'ms')
            })
        }
    },
    isDeleteButtonEnabled: {
        value: function () {
            return this.isEnabled(this.deleteButton).catch(err => {
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
            return this.waitForVisible(nameXpath, 3000).then(() => {
                return this.doClick(nameXpath);
            }).pause(400).catch((err) => {
                this.saveScreenshot('err_find_' + name);
                throw Error('Row with the name ' + name + ' was not found')
            })
        }
    },
    clickOnRowByDisplayName: {
        value: function (displayName) {
            var nameXpath = panel.treeGrid + elements.itemByDisplayName(displayName);
            return this.waitForVisible(nameXpath, 3000).then(() => {
                return this.doClick(nameXpath);
            }).pause(400).catch((err) => {
                this.saveScreenshot('err_find_' + displayName);
                throw Error('Row with the displayName ' + displayName + ' was not found')
            })
        }
    },
    waitForRowByNameVisible: {
        value: function (name) {
            var nameXpath = panel.treeGrid + elements.itemByName(name);
            return this.waitForVisible(nameXpath, 3000)
                .catch((err) => {
                    this.saveScreenshot('err_find_' + name);
                    throw Error('Row with the name ' + name + ' is not visible after ' + 3000 + 'ms')
                })
        }
    },
    waitForContentByDisplayNameVisible: {
        value: function (displayName) {
            var nameXpath = panel.treeGrid + elements.itemByDisplayName(displayName);
            return this.waitForVisible(nameXpath, 3000).catch(err => {
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
            }).pause(200).catch(err => {
                this.saveScreenshot('err_find_item');
                throw Error(`Row with the displayName ${displayName} was not found.`)
            })
        }
    },
    clickOnCheckboxAndSelectRowByName: {
        value: function (name) {
            let nameXpath = panel.checkboxByName(name);
            return this.waitForVisible(nameXpath, 2000).then(() => {
                return this.doClick(nameXpath);
            }).pause(300).catch(err => {
                this.saveScreenshot('err_find_item');
                throw Error('Row with the name ' + name + ' was not found ' + err)
            })
        }
    },
    // clickOnRowByDisplayName: {
    //     value: function (name) {
    //         var nameXpath = panel.rowByDisplayName(name);
    //         return this.waitForVisible(nameXpath, 3000).then(() => {
    //             return this.doClick(nameXpath);
    //         }).pause(400).catch((err) => {
    //             this.saveScreenshot('err_find_' + name);
    //             throw Error('Row with the name ' + name + ' was not found')
    //         })
    //     }
    // },
    getNumberOfSelectedRows: {
        value: function () {
            return this.elements(panel.selectedRows).then(result => {
                return result.value.length;
            }).catch(err => {
                throw new Error(`Error when getting selected rows ` + err);
            });
        }
    },
    getNumberOfCheckeddRows: {
        value: function () {
            return this.elements(panel.checkedRows).then(result => {
                return result.value.length;
            }).catch(err => {
                throw new Error(`Error when getting selected rows ` + err);
            });
        }
    },

    doCloseWindowTabAndSwitchToBrowsePanel: {
        value: function (displayName) {
            return this.getBrowser().close().pause(300).then(() => {
                return saveBeforeCloseDialog.isDialogPresent(100);
            }).then((result) => {
                if (result) {
                    this.saveScreenshot('err_save_close_item').then(() => {
                        console.log('save before close dialog must not be present');
                        throw new Error('`Save Before Close` dialog should not appear when try to close the ' + displayName);
                    });
                }
            }).then(() => {
                return this.doSwitchToContentBrowsePanel();
            });
        }
    },
    clickOnExpanderIcon: {
        value: function (name) {
            var expanderIcon = panel.treeGrid + panel.expanderIconByName(name);
            return this.doClick(expanderIcon).pause(700).catch(err => {
                this.saveScreenshot('err_click_on_expander ' + name);
                throw new Error('error when click on expander-icon ' + err);
            })
        }
    },
    isExpanderIconPresent: {
        value: function (name) {
            var expanderIcon = panel.treeGrid + panel.expanderIconByName(name);
            return this.waitForVisible(expanderIcon).catch(err => {
                this.saveScreenshot('expander_not_exists ' + name);
                return false;
            })
        }
    },
    // this method does not wait, it just checks the attribute
    isRedIconDisplayed: {
        value: function (contentName) {
            var xpath = panel.contentSummaryByName(contentName);
            return this.getBrowser().getAttribute(xpath, 'class').then(result => {
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
            return this.doClick(this.showPublishMenuButton).then(() => {
                return this.waitForVisible(this.createIssueMenuItem);
            }).then(() => {
                return this.doClick(this.createIssueMenuItem);
            }).catch(err => {
                this.saveScreenshot("err_click_create_issue_menuItem");
                throw new Error('error when try to click on Create Issue menu item, ' + err);
            })

        }
    },
    hotKeyPublish: {
        value: function () {
            return this.getBrowser().status().then(status => {
                if (status.value.os.name.toLowerCase().includes('wind') || status.value.os.name.toLowerCase().includes('linux')) {
                    return this.getBrowser().keys(['Control', 'Alt', 'p']);
                }
                if (status.value.os.name.toLowerCase().includes('mac')) {
                    return this.getBrowser().keys(['Command', 'Alt', 'p']);
                }
            })
        }
    },
    hotKeyDelete: {
        value: function () {
            return this.getBrowser().status().then(status => {
                if (status.value.os.name.toLowerCase().includes('wind') || status.value.os.name.toLowerCase().includes('linux')) {
                    return this.getBrowser().keys(['Control', 'Delete']);
                }
                if (status.value.os.name.toLowerCase().includes('mac')) {
                    return this.getBrowser().keys(['Command', 'Delete']);
                }
            })
        }
    },
    hotKeyEdit: {
        value: function () {
            return this.getBrowser().status().then(status => {
                if (status.value.os.name.toLowerCase().includes('wind') || status.value.os.name.toLowerCase().includes('linux')) {
                    return this.getBrowser().keys(['Control', 'e']);
                }
                if (status.value.os.name.toLowerCase().includes('mac')) {
                    return this.getBrowser().keys(['Command', 'e']);
                }
            })
        }
    },
    hotKeyNew: {
        value: function () {
            return this.getBrowser().keys(['Alt', 'n']);
        }
    },
    getContentStatus: {
        value: function (name) {
            let selector =  elements.slickRowByDisplayName(panel.treeGrid,name) + "//div[contains(@class,'r3')]";
            return this.getText(selector);
        }
    },
});
module.exports = contentBrowsePanel;


