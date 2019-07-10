/**
 * Created on 5/31/2017.
 */
const Page = require('../page');
const ContentDuplicateDialog = require('../content.duplicate.dialog');
const CreateIssueDialog = require('../issue/create.issue.dialog');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'ContentBrowsePanel')]",
    toolbar: `//div[contains(@id,'ContentBrowseToolbar')]`,
    treeGridToolbar: `//div[contains(@id,'ContentTreeGridToolbar')]`,
    treeGrid: `//div[contains(@id,'ContentTreeGrid')]`,
    appBar: `//div[contains(@id,'AppBar')]`,
    selectedRow: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::div[contains(@class,'slick-cell') and contains(@class,'highlight')]]`,
    checkedRows: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-cell-checkboxsel selected')]`,
    searchButton: "//button[contains(@class, 'icon-search')]",
    showIssuesListButton: "//button[contains(@id,'ShowIssuesDialogButton')]",
    createIssueMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Create Issue...']",
    createIssueButton: "//button[contains(@id,'ActionButton')]//span[text()='Create Issue...']",
    contentPublishMenuButton: `//div[contains(@id,'ContentBrowsePublishMenuButton')]`,
    selectionControllerCheckBox: `//div[contains(@id,'SelectionController')]`,
    selectionPanelToggler: `//button[contains(@id,'SelectionPanelToggler')]`,
    numberInSelectionToggler: `//button[contains(@id,'SelectionPanelToggler')]/span`,
    duplicateButton: `/button[contains(@id,'ActionButton') and child::span[contains(.,'Duplicate...')]]`,
    contentSummaryByName: function (name) {
        return `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
    },
    publishMenuItemByName: function (name) {
        return `//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='${name}']]`
    },
    rowByDisplayName:
        displayName => `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,

    checkboxByName: function (name) {
        return `${lib.itemByName(
            name)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },
    checkboxByDisplayName: displayName => `${lib.itemByDisplayName(
        displayName)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`,

    expanderIconByName: function (name) {
        return lib.itemByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;
    },
}

class ContentBrowsePanel extends Page {

    get deleteButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='Delete...']]`;
    }

    get moveButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='Move...']]`;
    }

    get duplicateButton() {
        return XPATH.toolbar + XPATH.duplicateButton;
    }

    get previewButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[contains(.,'Preview')]]`;
    }
    get sortButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[contains(.,'Sort...')]]`;
    }

    get searchButton() {
        return XPATH.toolbar + XPATH.searchButton;
    }

    get detailsPanelToggleButton() {
        return XPATH.container + lib.DETAILS_PANEL_TOGGLE_BUTTON;
    }

    get showPublishMenuButton() {
        return XPATH.toolbar + XPATH.contentPublishMenuButton + lib.DROP_DOWN_HANDLE;
    }

    get createIssueMenuItem() {
        return XPATH.toolbar + XPATH.createIssueMenuItem;
    }

    get createIssueButton() {
        return XPATH.toolbar + XPATH.createIssueButton;
    }

    get showIssuesListButton() {
        return XPATH.appBar + XPATH.showIssuesListButton;
    }

    get selectionControllerCheckBox() {
        return XPATH.treeGridToolbar + XPATH.selectionControllerCheckBox;
    }

    get selectionPanelToggler() {
        return `${XPATH.treeGridToolbar}${XPATH.selectionPanelToggler}`;
    }

    get newButton() {
        return `${XPATH.toolbar}/*[contains(@id, 'ActionButton') and child::span[contains(.,'New...')]]`
    }

    get editButton() {
        return `${XPATH.toolbar}/*[contains(@id, 'ActionButton') and child::span[text()='Edit']]`;
    }

    get numberInToggler() {
        return XPATH.treeGridToolbar + XPATH.numberInSelectionToggler;
    }

    get publishButton() {
        return XPATH.toolbar + `//button[contains(@id, 'ActionButton') and child::span[contains(.,'Publish...')]]`
    }

    get unpublishButton() {

        return XPATH.toolbar + `//button[contains(@id, 'ActionButton') and child::span[contains(.,'Unpublish...')]]`
    }

    get publishTreeButton() {
        return XPATH.toolbar + `//button[contains(@id, 'ActionButton') and child::span[contains(.,'Publish Tree...')]]`;
    }

    get displayNames() {
        return XPATH.treeGrid + lib.H6_DISPLAY_NAME;
    }

    hotKeyPublish() {
        return this.getBrowser().status().then(status => {
            if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
                return this.getBrowser().keys(['Control', 'Alt', 'p']);
            }
            if (status.os.name.toLowerCase().includes('mac')) {
                return this.getBrowser().keys(['Command', 'Alt', 'p']);
            }
        })
    }

    hotKeyNew() {
        return this.getBrowser().keys(['Alt', 'n']);
    }


    hotKeyDelete() {
        return this.getBrowser().status().then(status => {
            if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
                return this.getBrowser().keys(['Control', 'Delete']);
            }
            if (status.os.name.toLowerCase().includes('mac')) {
                return this.getBrowser().keys(['Command', 'Delete']);
            }
        })
    }

    hotKeyEdit() {
        return this.getBrowser().status().then(status => {
            if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
                return this.getBrowser().keys(['Control', 'e']);
            }
            if (status.os.name.toLowerCase().includes('mac')) {
                return this.getBrowser().keys(['Command', 'e']);
            }
        }).then(() => {
            return this.pause(1000);
        })
    }

    waitForPublishButtonVisible() {
        return this.waitForElementDisplayed(this.publishButton, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot("err_publish_button");
            throw new Error("Publish button is not visible! " + err);
        })
    }

    waitForUnPublishButtonVisible() {
        return this.waitForElementDisplayed(this.unpublishButton, appConst.TIMEOUT_2).catch(err => {
            throw new Error('Unpublish button is not displayed after 2 seconds ' + err);
        })
    }

    waitForPublishTreeButtonVisible() {
        return this.waitForElementDisplayed(this.publishTreeButton, appConst.TIMEOUT_3);
    }

    clickOnPublishTreeButton() {
        return this.clickOnElement(this.publishTreeButton);
    }

    waitForGridLoaded(ms) {
        return this.waitForElementDisplayed(lib.GRID_CANVAS, ms).then(() => {
            return this.waitForSpinnerNotVisible(appConst.TIMEOUT_5);
        }).then(() => {
            return console.log('content browse panel is loaded')
        }).catch(err => {
            throw new Error('content browse panel was not loaded in ' + ms);
        });
    }

    clickOnMoveButton() {
        return this.clickOnElement(this.moveButton).catch(err => {
            throw new Error('error when clicking on the Move button ' + err);
        })
    }

    async clickOnPublishButton() {
        await this.waitForPublishButtonVisible();
        await this.pause(400);
        return await this.clickOnElement(this.publishButton);

    }
    async clickOnSortButton() {
        await this.waitForElementEnabled(this.sortButton);
        await this.pause(200);
        return await this.clickOnElement(this.sortButton);
    }

    clickOnDuplicateButton() {
        return this.clickOnElement(this.duplicateButton).catch(err => {
            throw new Error('error when clicking on the Duplicate button ' + err);
        })
    }

    clickOnDetailsPanelToggleButton() {
        return this.clickOnElement(this.detailsPanelToggleButton).catch(err => {
            this.saveScreenshot('err_click_on_details_panel_toggle');
            throw new Error(`Error when clicking on Details Panel toggler` + err);
        });
    }

    clickOnSelectionControllerCheckbox() {
        return this.clickOnElement(this.selectionControllerCheckBox).catch(() => {
            this.saveScreenshot('err_click_on_selection_controller');
            throw new Error(`Error when clicking on Selection controller ` + err);
        });
    }

    clickOnExpanderIcon(name) {
        let expanderIcon = XPATH.treeGrid + XPATH.expanderIconByName(name);
        return this.clickOnElement(expanderIcon).then(() => {
            return this.pause(900);
        }).catch(err => {
            this.saveScreenshot('err_click_on_expander');
            throw new Error('error when click on expander-icon ' + err);
        })
    }

    async clickOnShowIssuesListButton() {
        await this.waitForElementDisplayed(this.showIssuesListButton);
        return await this.clickOnElement(this.showIssuesListButton).catch(err => {
            throw new Error('error when click on the button ' + err);
        })
    }

    clickOnSearchButton() {
        return this.clickOnElement(this.searchButton);
    }

    async clickOnEditButton() {
        await this.waitForElementEnabled(this.editButton, appConst.TIMEOUT_2);
        return await this.clickOnElement(this.editButton).catch(err => {
            this.saveScreenshot('err_browsepanel_edit');
            throw new Error('Edit button is not enabled! ' + err);
        })
    }

    //wait for the "Show Selection" icon on the toolbar
    async waitForSelectionTogglerVisible() {
        try {
            await this.waitForElementDisplayed(this.selectionPanelToggler, appConst.TIMEOUT_3);
            let attr = await this.getAttribute(this.selectionPanelToggler, 'class');
            return attr.includes('any-selected');
        } catch (err) {
            return false
        }
    }

    //gets list of content display names
    getDisplayNamesInGrid() {
        return this.getTextInElements(this.displayNames).catch(err => {
            this.saveScreenshot('err_click_on_details_panel_toggle');
            throw new Error(`Error when getting display names in grid` + err);
        });
    }

    async openPublishMenuSelectItem(menuItem) {
        await this.waitForShowPublishMenuButtonVisible();
        await this.clickOnElement(this.showPublishMenuButton);
        await this.waitForElementDisplayed(this.createIssueMenuItem);
        let selector = XPATH.toolbar + XPATH.publishMenuItemByName(menuItem);
        await this.clickOnElement(selector).catch(err => {
            this.saveScreenshot("err_click_issue_menuItem");
            throw new Error('error when try to click on publish menu item, ' + err);
        });
        let createIssueDialog = new CreateIssueDialog();
        return await createIssueDialog.waitForDialogLoaded();
    }

    waitForPanelVisible(ms) {
        return this.waitForElementDisplayed(XPATH.toolbar, ms).catch(err => {
            throw new Error('Content browse panel was not loaded in ' + ms);
        });
    }

    // clicks on 'Duplicate button' and waits until modal dialog appears
    clickOnDuplicateButtonAndWait() {
        return this.waitForElementEnabled(this.duplicateButton, appConst.TIMEOUT_3).then(() => {
            return this.clickOnElement(this.duplicateButton);
        }).catch(err => {
            throw new Error('error when clicking on the Duplicate button ' + err);
        }).then(() => {
            let contentDuplicateDialog = new ContentDuplicateDialog();
            return contentDuplicateDialog.waitForDialogOpened();
        }).then(() => {
            return this.waitForSpinnerNotVisible(appConst.TIMEOUT_3);
        });
    }

    waitForContentDisplayed(contentName) {
        return this.waitForElementDisplayed(XPATH.treeGrid + lib.itemByName(contentName), appConst.TIMEOUT_3).catch(err => {
            console.log("item is not displayed:" + contentName);
            this.saveScreenshot('err_find_' + contentName)
            throw new Error('content was not found! ' + contentName);
        });
    }

    waitForItemNotDisplayed(contentName) {
        return this.waitForElementNotDisplayed(XPATH.treeGrid + lib.itemByName(contentName), appConst.TIMEOUT_3).catch(err => {
            console.log("content is still displayed:" + contentName);
            return false;
        });
    }

    clickOnNewButton() {
        return this.waitForElementEnabled(this.newButton, 1000).then(() => {
            return this.clickOnElement(this.newButton);
        }).catch(err => {
            throw new Error('New button is not enabled! ' + err);
        })
    }

    clickOnDeleteButton() {
        return this.waitForElementEnabled(this.deleteButton, 2000).then(() => {
            return this.clickOnElement(this.deleteButton);
        }).catch(err => {
            this.saveScreenshot('err_browsepanel_delete');
            throw new Error('Delete button is not enabled! ' + err);
        })
    }

    clickOnPreviewButton() {
        return this.waitForElementEnabled(this.previewButton, 2000).then(() => {
            return this.clickOnElement(this.previewButton);
        }).catch(err => {
            this.saveScreenshot('err_browsepanel_preview');
            throw new Error('Error when clicking on Preview button ' + err);
        }).then(() => {
            return this.pause(2000);
        })
    }

    isSearchButtonDisplayed() {
        return this.isElementDisplayed(this.searchButton);
    }

    waitForNewButtonEnabled() {
        return this.waitForElementEnabled(this.newButton, 3000).catch(err => {
            this.saveScreenshot('err_new_button');
            return false;
        })
    }

    waitForEditButtonEnabled() {
        return this.waitForElementEnabled(this.editButton, appConst.TIMEOUT_5).catch(err => {
            this.saveScreenshot('err_edit_button');
            throw Error('Edit button is not enabled after ' + appConst.TIMEOUT_5 + 'ms')
        })
    }

    waitForDeleteButtonEnabled() {
        return this.waitForElementEnabled(this.deleteButton, 3000).catch(err => {
            this.saveScreenshot('err_delete_button');
            throw Error('Delete button is not enabled after ' + 3000 + 'ms')
        })
    }

    waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, 3000).catch(err => {
            this.saveScreenshot('err_delete_disabled_button');
            throw Error('Delete button should be disabled, timeout: ' + 3000 + 'ms')
        })
    }

    isDeleteButtonEnabled() {
        return this.isElementEnabled(this.deleteButton);
    }

    isNewButtonEnabled() {
        return this.isElementEnabled(this.newButton);
    }

    isEditButtonEnabled() {
        return this.isElementEnabled(this.editButton);
    }

    clickOnRowByName(name) {
        let nameXpath = XPATH.treeGrid + lib.itemByName(name);
        return this.waitForElementDisplayed(nameXpath, 3000).then(() => {
            return this.clickOnElement(nameXpath);
        }).catch(err => {
            this.saveScreenshot('err_find_' + name);
            throw Error('Row with the name ' + name + ' was not found' + err);
        }).then(() => {
            return this.pause(300);
        });
    }

    clickOnRowByDisplayName(displayName) {
        let nameXpath = XPATH.treeGrid + lib.itemByDisplayName(displayName);
        return this.waitForElementDisplayed(nameXpath, 3000).then(() => {
            return this.clickOnElement(nameXpath);
        }).then(() => {
            return this.pause(300);
        }).catch(err => {
            this.saveScreenshot('err_find_' + displayName);
            throw Error('Row with the displayName ' + displayName + ' was not found' + err)
        })
    }

    waitForRowByNameVisible(name) {
        let nameXpath = XPATH.treeGrid + lib.itemByName(name);
        return this.waitForElementDisplayed(nameXpath, 3000)
            .catch(err => {
                this.saveScreenshot('err_find_' + name);
                throw Error('Row with the name ' + name + ' is not visible after ' + 3000 + 'ms')
            })
    }

    waitForContentByDisplayNameVisible(displayName) {
        let nameXpath = XPATH.treeGrid + lib.itemByDisplayName(displayName);
        return this.waitForElementDisplayed(nameXpath, 3000).catch(err => {
            this.saveScreenshot('err_find_' + displayName);
            throw Error('Content with the displayName ' + displayName + ' is not visible after ' + 3000 + 'ms')
        })
    }

    clickCheckboxAndSelectRowByDisplayName(displayName) {
        const displayNameXpath = XPATH.checkboxByDisplayName(displayName);
        return this.waitForElementDisplayed(displayNameXpath, 2000).then(() => {
            return this.clickOnElement(displayNameXpath);
        }).then(() => {
            return this.pause(400);
        }).catch(err => {
            this.saveScreenshot('err_find_item');
            throw Error(`Row with the displayName ${displayName} was not found.` + err);
        })
    }

    clickOnCheckboxAndSelectRowByName(name) {
        let nameXpath = XPATH.checkboxByName(name);
        return this.waitForElementDisplayed(nameXpath, 2000).then(() => {
            return this.clickOnElement(nameXpath);
        }).then(() => {
            return this.pause(300);
        }).catch(err => {
            this.saveScreenshot('err_find_item');
            throw Error('Row with the name ' + name + ' was not found ' + err)
        })
    }

    getNumberOfSelectedRows() {
        return this.findElements(XPATH.selectedRow).then(result => {
            return result.length;
        }).catch(err => {
            throw new Error(`Error when getting selected rows ` + err);
        });
    }

    getNameOfSelectedRow() {
        return this.findElements(XPATH.selectedRow).then(result => {
            return this.getText(XPATH.selectedRow + lib.H6_DISPLAY_NAME);
        }).catch(err => {
            throw new Error(`Error when getting selected rows ` + err);
        });
    }

    async getSortingIcon(name) {
        let selector = lib.slickRowByDisplayName(XPATH.treeGrid, name) + "//div[contains(@class,'r2')]/span/div";
        let elems = await this.findElements(selector);
        if (elems.length === 0) {
            return "Default";
        }
        let classAttr = await elems[0].getAttribute("class");
        if (classAttr.includes('num-asc')) {
            return "Date ascending";
        } else if (classAttr.includes('num-desc')) {
            return "Date descending";
        } else if (classAttr === 'sort-dialog-trigger icon-menu') {
            return appConst.sortMenuItem.MANUALLY_SORTED;
        }
    }

    getNumberOfCheckedRows() {
        return this.findElements(XPATH.checkedRows).then(result => {
            return result.length;
        }).catch(err => {
            throw new Error(`Error when getting selected rows ` + err);
        });
    }

    isExpanderIconPresent(name) {
        let expanderIcon = XPATH.treeGrid + XPATH.expanderIconByName(name);
        return this.waitForElementDisplayed(expanderIcon).catch(err => {
            this.saveScreenshot('expander_not_exists ' + name);
            return false;
        })
    }

    // this method does not wait, it just checks the attribute
    isRedIconDisplayed(contentName) {
        let xpath = XPATH.contentSummaryByName(contentName);
        return this.getAttribute(xpath, 'class').then(result => {
            return result.includes('invalid');
        });
    }

    // this method waits until 'invalid' appears in the @class
    waitForRedIconDisplayed(contentName) {
        let xpath = XPATH.contentSummaryByName(contentName);
        return this.waitUntilInvalid(xpath);
    }

    getContentStatus(name) {
        let selector = lib.slickRowByDisplayName(XPATH.treeGrid, name) + "//div[contains(@class,'r3')]";
        return this.getText(selector);
    }

    waitForShowPublishMenuButtonVisible() {
        return this.waitForElementDisplayed(this.showPublishMenuButton, appConst.TIMEOUT_3);
    }

    waitForCreateIssueButtonVisible() {
        return this.waitForElementDisplayed(this.createIssueButton, appConst.TIMEOUT_5).catch(err => {
            this.saveScreenshot("err_create_issue_button");
            throw new Error("Create issue button is not visible on the toolbar! " + err);
        });
    }

    clickOnCreateIssueButton() {
        return this.waitForCreateIssueButtonVisible().then(() => {
            return this.clickOnElement(this.createIssueButton);
        }).catch(err => {
            this.saveScreenshot("err_click_create_issue_button");
            throw new Error("Browse Panel. Error when click on Create issue button on the toolbar! " + err);
        });
    }

    openPublishMenuAndClickOnCreateIssue() {
        return this.waitForShowPublishMenuButtonVisible().then(() => {
            return this.clickOnElement(this.showPublishMenuButton);
        }).then(() => {
            return this.waitForElementDisplayed(this.createIssueMenuItem);
        }).then(() => {
            return this.clickOnElement(this.createIssueMenuItem);
        }).catch(err => {
            this.saveScreenshot("err_click_create_issue_menuItem");
            throw new Error('error when try to click on Create Issue menu item, ' + err);
        }).then(() => {
            let createIssueDialog = new CreateIssueDialog();
            return createIssueDialog.waitForDialogLoaded();
        })
    }
};
module.exports = ContentBrowsePanel;

