/**
 * Created on 5/31/2017.
 */
const ContentDuplicateDialog = require('../content.duplicate.dialog');
const CreateTaskDialog = require('../issue/create.task.dialog');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ConfirmationDialog = require('../confirmation.dialog');
const CreateRequestPublishDialog = require('../issue/create.request.publish.dialog');
const ContentDeleteDialog = require('../../page_objects/delete.content.dialog');
const ConfirmValueDialog = require('../confirm.content.delete.dialog');
const BrowseDetailsPanel = require('../browsepanel/detailspanel/browse.details.panel');
const BaseBrowsePanel = require('../base.browse.panel');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const ContentUnpublishDialog = require('../content.unpublish.dialog');

const XPATH = {
    container: "//div[contains(@id,'ContentBrowsePanel')]",
    toolbar: "//div[contains(@id,'ContentBrowseToolbar')]",
    treeGridToolbar: "//div[contains(@id,'ContentTreeGridToolbar')]",
    treeGrid: "//div[contains(@id,'ContentTreeGrid')]",
    appBar: "//div[contains(@id,'AppBar')]",
    projectViewerButton: "//div[contains(@id,'ProjectViewer')]",
    highlightedRow: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::div[contains(@class,'slick-cell') and contains(@class,'highlight')]]`,
    checkedRows: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-cell-checkboxsel selected')]`,
    searchButton: "//button[contains(@class, 'icon-search')]",
    showIssuesListButton: "//button[contains(@id,'ShowIssuesDialogButton')]",
    createTaskMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Create Task...']",
    markAsReadyMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Mark as ready']",
    requestPublishMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Request Publish']",
    createTaskButton: "//button[contains(@id,'ActionButton')]//span[text()='Create Task...']",
    contentPublishMenuButton: `//div[contains(@id,'ContentBrowsePublishMenuButton')]`,
    selectionControllerCheckBox: `//div[contains(@id,'SelectionController')]`,
    numberInSelectionToggler: `//button[contains(@id,'SelectionPanelToggler')]/span`,
    duplicateButton: `/button[contains(@id,'ActionButton') and child::span[contains(.,'Duplicate...')]]`,
    contentSummaryListViewerByName: function (name) {
        return `//div[contains(@id,'ContentSummaryListViewer') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
    },
    contentSummaryByName: function (name) {
        return `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
    },
    contentSummaryByDisplayName: function (displayName) {
        return `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`
    },
    publishMenuItemByName: function (name) {
        return `//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and contains(.,'${name}')]`
    },
    rowByDisplayName:
        displayName => `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,

    checkboxByName: function (name) {
        return `${lib.itemByName(
            name)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },

    expanderIconByName: function (name) {
        return lib.itemByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;
    },
    defaultActionByName: name => `//button[contains(@id, 'ActionButton') and child::span[contains(.,'${name}')]]`,
};

class ContentBrowsePanel extends BaseBrowsePanel {

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

    get localizeButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[contains(.,'Localize')]]`;
    }

    get openButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[contains(.,'Open')]]`;
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

    get createTaskMenuItem() {
        return XPATH.toolbar + XPATH.createTaskMenuItem;
    }

    get requestPublishMenuItem() {
        return XPATH.toolbar + XPATH.requestPublishMenuItem;
    }

    get markAsReadyMenuItem() {
        return XPATH.toolbar + XPATH.markAsReadyMenuItem;
    }

    get createTaskButton() {
        return XPATH.toolbar + XPATH.createTaskButton;
    }

    get showIssuesListButton() {
        return XPATH.appBar + XPATH.showIssuesListButton;
    }

    get selectionControllerCheckBox() {
        return XPATH.treeGridToolbar + XPATH.selectionControllerCheckBox;
    }

    get selectionPanelToggler() {
        return `${XPATH.treeGridToolbar}${lib.SELECTION_PANEL_TOGGLER}`;
    }

    get newButton() {
        return `${XPATH.toolbar}/*[contains(@id, 'ActionButton') and child::span[contains(.,'New...')]]`
    }

    get editButton() {
        return `${XPATH.toolbar}/*[contains(@id, 'ActionButton') and child::span[text()='Edit']]`;
    }

    get undoDeleteButton() {
        return XPATH.toolbar + "/*[contains(@id, 'ActionButton') and child::span[text()='Undo delete']]";
    }

    get numberInToggler() {
        return XPATH.treeGridToolbar + XPATH.numberInSelectionToggler;
    }

    get publishButton() {
        return XPATH.contentPublishMenuButton + `//button[contains(@id, 'ActionButton') and child::span[contains(.,'Publish...')]]`
    }

    get unpublishButton() {

        return XPATH.contentPublishMenuButton + `//button[contains(@id, 'ActionButton') and child::span[contains(.,'Unpublish...')]]`
    }

    get publishTreeButton() {
        return XPATH.contentPublishMenuButton + `//button[contains(@id, 'ActionButton') and child::span[contains(.,'Publish Tree...')]]`;
    }

    get markAsReadyButton() {
        return XPATH.contentPublishMenuButton + `//button[contains(@id, 'ActionButton') and child::span[contains(.,'Mark as ready')]]`;
    }

    get displayNames() {
        return XPATH.treeGrid + lib.H6_DISPLAY_NAME;
    }

    get treeGrid() {
        return XPATH.container + XPATH.treeGrid;
    }

    get projectViewerButton() {
        return "//div[contains(@id,'ContentAppBar')]" + XPATH.projectViewerButton;
    }

    async clickOnProjectViewerButton() {
        let projectSelectionDialog = new ProjectSelectionDialog();
        await this.waitForElementDisplayed(this.projectViewerButton, appConst.shortTimeout);
        await this.clickOnElement(this.projectViewerButton);
        await projectSelectionDialog.waitForDialogLoaded();
        return projectSelectionDialog;
    }

    async isProjectViewerClickable() {
        await this.waitForElementDisplayed(this.projectViewerButton, appConst.shortTimeout);
        return await this.isClickable(this.projectViewerButton);
    }

    //Opens menu and select the project
    async selectContext(projectDisplayName) {
        let projectSelectionDialog = await this.clickOnProjectViewerButton();
        await projectSelectionDialog.selectContext(projectDisplayName);
        await projectSelectionDialog.waitForDialogClosed();
        return await this.pause(1000);
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

    //Wait for `Publish Menu` Button gets `Publish...`
    async waitForPublishButtonVisible() {
        try {
            return await this.waitForElementDisplayed(this.publishButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot("err_publish_button");
            throw new Error("Publish button is not visible! " + err);
        }
    }

    waitForStateIconNotDisplayed(displayName) {
        let xpath = XPATH.contentSummaryByDisplayName(displayName);
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(xpath, 'class').then(result => {
                return (!result.includes('in-progress') && !result.includes('ready'));
            });
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Workflow icon is still visible in content: " + displayName});
    }

    //Wait for `Publish Menu` Button gets 'Mark as ready'
    waitForMarkAsReadyButtonVisible() {
        return this.waitForElementDisplayed(this.markAsReadyButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot("err_publish_button_mark_as_ready");
            throw new Error("Mark as Ready button is not visible! " + err);
        })
    }

    //Wait for `Publish Menu` Button gets 'Unpublish'
    waitForUnPublishButtonVisible() {
        return this.waitForElementDisplayed(this.unpublishButton, appConst.shortTimeout).catch(err => {
            throw new Error('Unpublish button is not displayed after 2 seconds ' + err);
        })
    }

    //Wait for `Publish Menu` Button gets 'Publish Tree...'
    waitForPublishTreeButtonVisible() {
        return this.waitForElementDisplayed(this.publishTreeButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot("err_browse_publish_tree_button");
            throw new Error("'Publish Tree' button should be present on the browse-toolbar " + err);
        })
    }

    //Click on Unpublish default action and wait for modal dialog is loaded:
    async clickOnUnpublishButton() {
        await this.waitForUnPublishButtonVisible();
        await this.clickOnElement(this.unpublishButton);
        let unpublishDialog = new ContentUnpublishDialog();
        await unpublishDialog.waitForDialogOpened();
        return unpublishDialog;
    }

    async clickOnPublishTreeButton() {
        await this.waitForPublishTreeButtonVisible();
        return await this.clickOnElement(this.publishTreeButton);
    }

    async clickOnUndoDeleteButton() {
        await this.waitForElementDisplayed(this.undoDeleteButton, appConst.shortTimeout);
        return await this.clickOnElement(this.undoDeleteButton);
    }

    //waits for button MARK AS READY appears on the toolbar, then click on it and confirm.
    async clickOnMarkAsReadyButtonAndConfirm() {
        await this.waitForMarkAsReadyButtonVisible();
        await this.clickOnElement(this.markAsReadyButton);
        let confirmationDialog = new ConfirmationDialog();
        await confirmationDialog.waitForDialogOpened();
        return await confirmationDialog.clickOnYesButton();
    }

    //Opens 'Delete Content Dialog' and clicks on 'Mark as deleted' menu item:
    async doSelectedContentMarkAsDeleted() {
        let contentDeleteDialog = new ContentDeleteDialog();
        await this.clickOnDeleteButton();
        await contentDeleteDialog.waitForDialogOpened();
        await contentDeleteDialog.clickOnMarkAsDeletedMenuItem();
        await contentDeleteDialog.waitForDialogClosed();
        return await this.pause(1000);
    }

    //When single content is selected, confirmation is no needed
    async clickOnMarkAsReadyButton() {
        await this.waitForMarkAsReadyButtonVisible();
        await this.clickOnElement(this.markAsReadyButton);
        return await this.pause(500);
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
        await this.waitForElementEnabled(this.sortButton, appConst.mediumTimeout);
        await this.pause(200);
        await this.clickOnElement(this.sortButton);
        return await this.pause(400);
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

    async clickOnExpanderIcon(name) {
        try {
            let expanderIcon = XPATH.treeGrid + XPATH.expanderIconByName(name);
            await this.clickOnElement(expanderIcon);
            return await this.pause(900);
        } catch (err) {
            await this.saveScreenshot('err_click_on_expander');
            throw new Error('error when clicking on expander-icon ' + err);
        }
    }

    async clickOnShowIssuesListButton() {
        try {
            await this.waitForElementDisplayed(this.showIssuesListButton, appConst.shortTimeout);
            return await this.clickOnElement(this.showIssuesListButton);
        } catch (err) {
            throw new Error('error when click on the button ' + err);
        }
    }

    clickOnSearchButton() {
        return this.clickOnElement(this.searchButton);
    }

    // clicks on 'Duplicate button' and waits until modal dialog appears
    async clickOnDuplicateButtonAndWait() {
        try {
            await this.waitForElementEnabled(this.duplicateButton, appConst.mediumTimeout);
            await this.clickOnElement(this.duplicateButton);
            //Wait for modal dialog loaded:
            let contentDuplicateDialog = new ContentDuplicateDialog();
            await contentDuplicateDialog.waitForDialogOpened();
            await contentDuplicateDialog.waitForSpinnerNotVisible(appConst.mediumTimeout);
            return contentDuplicateDialog;
        } catch (err) {
            throw new Error('error when clicking on the Duplicate button ' + err);
        }
    }

    async waitForContentDisplayed(contentName, ms) {
        try {
            let timeout = ms ? ms : appConst.mediumTimeout;
            console.log("waitForContentDisplayed, timeout is:" + timeout);
            return await this.waitForElementDisplayed(XPATH.treeGrid + lib.itemByName(contentName), timeout);
        } catch (err) {
            console.log("item is not displayed:" + contentName);
            this.saveScreenshot('err_find_' + contentName);
            throw new Error('content is not displayed ! ' + contentName + "  " + err);
        }
    }

    waitForContentNotDisplayed(contentName) {
        return this.waitForElementNotDisplayed(XPATH.treeGrid + lib.itemByName(contentName), appConst.mediumTimeout).catch(err => {
            throw new Error("Content is still displayed :" + err);
        });
    }

    async clickOnPreviewButton() {
        try {
            await this.waitForElementEnabled(this.previewButton, appConst.shortTimeout);
            await this.clickOnElement(this.previewButton);
            return await this.pause(2000);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_browsepanel_preview"));
            throw new Error('Error when clicking on Preview button ' + err);
        }
    }

    isSearchButtonDisplayed() {
        return this.isElementDisplayed(this.searchButton);
    }

    waitForPreviewButtonDisabled() {
        return this.waitForElementDisabled(this.previewButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_preview_disabled_button');
            throw Error('Preview button should be disabled, timeout: ' + appConst.mediumTimeout + 'ms')
        })
    }

    waitForPreviewButtonEnabled() {
        return this.waitForElementEnabled(this.previewButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_preview_enabled_button');
            throw Error('Preview button should be enabled, timeout: ' + appConst.mediumTimeout + 'ms')
        })
    }

    waitForDetailsPanelToggleButtonDisplayed() {
        return this.waitForElementDisplayed(this.detailsPanelToggleButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_details_panel_displayed');
            throw Error('Details Panel toggle button should be displayed, timeout: ' + appConst.mediumTimeout + 'ms')
        })
    }

    waitForSortButtonDisabled() {
        return this.waitForElementDisabled(this.sortButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_sort_disabled_button');
            throw Error('Sort button should be disabled, timeout: ' + appConst.mediumTimeout + 'ms')
        })
    }

    async waitForDuplicateButtonDisabled() {
        try {
            await this.waitForElementDisplayed(this.duplicateButton, appConst.mediumTimeout);
            return await this.waitForElementDisabled(this.duplicateButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot('err_duplicate_disabled_button');
            throw Error('Duplicate button should be disabled, timeout: ' + 3000 + 'ms')
        }
    }

    async waitForLocalizeButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.localizeButton, appConst.mediumTimeout);
            return await this.waitForElementEnabled(this.localizeButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot('err_localize_enabled_button');
            throw Error('Localize button should be enabled, timeout: ' + 3000 + 'ms')
        }
    }

    async waitForLocalizeButtonDisabled() {
        try {
            await this.waitForElementDisplayed(this.localizeButton, appConst.mediumTimeout);
            return await this.waitForElementDisabled(this.localizeButton, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot('err_localize_disabled_button');
            throw Error('Localize button should be disabled, timeout: ' + 3000 + 'ms')
        }
    }

    async waitForOpenButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.openButton, appConst.mediumTimeout);
            return await this.waitForElementEnabled(this.openButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot('err_open_button_is_not_enabled');
            throw Error('Open button should be disabled, timeout: ' + 3000 + 'ms')
        }
    }

    async clickOnOpenButton() {
        try {
            await this.waitForOpenButtonEnabled();
            await this.clickOnElement(this.openButton);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_browse_panel_open_button');
            throw new Error('Browse Panel: Edit button is not enabled! ' + err);
        }
    }

    waitForMoveButtonDisabled() {
        return this.waitForElementDisabled(this.moveButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_move_disabled_button');
            throw Error('Move button should be disabled, timeout: ' + appConst.mediumTimeout + 'ms')
        })
    }

    waitForSortButtonEnabled() {
        return this.waitForElementEnabled(this.sortButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_sort_enabled_button');
            throw Error('Sort button should be enabled, timeout: ' + appConst.mediumTimeout + 'ms')
        })
    }

    waitForMoveButtonEnabled() {
        return this.waitForElementEnabled(this.moveButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_move_enabled_button');
            throw Error('Move button should be enabled, timeout: ' + appConst.mediumTimeout + 'ms')
        })
    }

    clickOnRowByDisplayName(displayName) {
        let nameXpath = XPATH.treeGrid + lib.itemByDisplayName(displayName);
        return this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout).then(() => {
            return this.clickOnElement(nameXpath);
        }).then(() => {
            return this.pause(600);
        }).catch(err => {
            this.saveScreenshot('err_find_' + displayName);
            throw Error('Row with the displayName ' + displayName + ' was not found' + err)
        })
    }

    waitForRowByNameVisible(name) {
        let nameXpath = XPATH.treeGrid + lib.itemByName(name);
        return this.waitForElementDisplayed(nameXpath, appConst.longTimeout).catch(err => {
            this.saveScreenshot('err_find_' + name);
            throw Error('Row with the name ' + name + ' is not visible after ' + 3000 + 'ms')
        })
    }

    waitForRowByDisplayNameVisible(name) {
        let nameXpath = XPATH.treeGrid + lib.itemByDisplayName(name);
        return this.waitForElementDisplayed(nameXpath, appConst.longTimeout).catch(err => {
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

    async clickOnCheckboxAndSelectRowByName(name) {
        try {
            await this.clickOnCheckbox(name);
            await this.waitForRowCheckboxSelected(name);
        } catch (err) {
            await this.saveScreenshot('err_select_item');
            throw Error('Row with the name ' + name + ' was not selected ' + err)
        }
    }

    async clickOnCheckbox(name) {
        let checkBox = XPATH.checkboxByName(name);
        await this.waitForElementDisplayed(checkBox, appConst.mediumTimeout);
        await this.clickOnElement(checkBox);
        return await this.pause(300);
    }

    getNumberOfSelectedRows() {
        return this.findElements(XPATH.highlightedRow).then(result => {
            return result.length;
        }).catch(err => {
            throw new Error(`Error when getting highlighted rows ` + err);
        });
    }

    getNameInHighlightedRow() {
        return this.waitForElementDisplayed(XPATH.highlightedRow, appConst.shortTimeout).then(() => {
            return this.getText(XPATH.highlightedRow + lib.H6_DISPLAY_NAME);
        }).catch(err => {
            throw new Error(`Error when getting name in the highlighted row ` + err);
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
            throw new Error(`Error when getting checked rows ` + err);
        });
    }

    isExpanderIconPresent(name) {
        let expanderIcon = XPATH.treeGrid + XPATH.expanderIconByName(name);
        return this.waitForElementDisplayed(expanderIcon, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('expander_not_exists ' + name);
            return false;
        })
    }

    // this method does not wait, it just checks the attribute
    isRedIconDisplayed(contentName) {
        let xpath = XPATH.contentSummaryListViewerByName(contentName);
        return this.getAttribute(xpath, 'class').then(result => {
            return result.includes('invalid');
        });
    }

    // this method waits until 'invalid' appears in the @class
    waitForRedIconDisplayed(contentName) {
        let xpath = XPATH.contentSummaryListViewerByName(contentName);
        return this.waitUntilInvalid(xpath);
    }

    getContentStatus(name) {
        let selector = lib.slickRowByDisplayName(XPATH.treeGrid, name) + "//div[contains(@class,'r3')]";
        return this.getText(selector);
    }

    waitForShowPublishMenuDropDownVisible() {
        return this.waitForElementDisplayed(this.showPublishMenuButton, appConst.mediumTimeout);
    }

    waitForCreateTaskButtonDisplayed() {
        return this.waitForElementDisplayed(this.createTaskButton, appConst.longTimeout).catch(err => {
            this.saveScreenshot("err_create_issue_button");
            throw new Error("Create Task button is not visible on the toolbar! " + err);
        });
    }

    async clickOnCreateTaskButton() {
        try {
            await this.waitForCreateTaskButtonDisplayed();
            return await this.clickOnElement(this.createTaskButton);
        } catch (err) {
            this.saveScreenshot("err_click_create_issue_button");
            throw new Error("Browse Panel. Error when click on Create Task button in the toolbar! " + err);
        }
    }

    waitUntilInvalid(selector) {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, 'class').then(result => {
                return result.includes('invalid');
            });
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Class should contain 'invalid' "});
    }

    async waitForPublishMenuItemDisabled(menuItem) {
        try {
            let selector = XPATH.toolbar + XPATH.publishMenuItemByName(menuItem);
            return await this.waitForAttributeHasValue(selector, "class", "disabled");
        } catch (err) {
            await this.saveScreenshot("err_publish_menuItem");
            throw new Error(menuItem + " should be disabled! " + err);
        }
    }

    async waitForPublishMenuItemEnabled(menuItem) {
        let selector = XPATH.toolbar + XPATH.publishMenuItemByName(menuItem);
        return await this.waitForAttributeNotIncludesValue(selector, "class", "disabled");
    }

    async openPublishMenu() {
        await this.clickOnElement(this.showPublishMenuButton);
        return await this.pause(300);
    }

    async openPublishMenuSelectItem(menuItem) {
        try {
            await this.waitForShowPublishMenuDropDownVisible();
            await this.clickOnElement(this.showPublishMenuButton);
            let selector = XPATH.toolbar + XPATH.publishMenuItemByName(menuItem);
            await this.waitForPublishMenuItemEnabled(menuItem);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot("err_click_issue_menuItem");
            throw new Error('error when try to click on publish menu item, ' + err);
        }
    }

    async getPublishMenuItems() {
        //await this.openPublishMenu();
        let locator = "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem')]";
        return await this.getTextInDisplayedElements(locator);

    }

    async openPublishMenuAndClickOnCreateTask() {
        await this.openPublishMenuSelectItem(appConst.PUBLISH_MENU.CREATE_TASK);
        let createTaskDialog = new CreateTaskDialog();
        return await createTaskDialog.waitForDialogLoaded();
    }

    async openPublishMenuAndClickOnRequestPublish() {
        await this.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        let createRequestPublishDialog = new CreateRequestPublishDialog();
        return await createRequestPublishDialog.waitForDialogLoaded();
    }

    async openPublishMenuAndClickOnMarAsReady() {
        return await this.openPublishMenuSelectItem(appConst.PUBLISH_MENU.MARK_AS_READY);
    }

    async openPublishMenuAndClickOnMarAsReadyAndConfirm() {
        await this.openPublishMenuSelectItem(appConst.PUBLISH_MENU.MARK_AS_READY);
        let confirmationDialog = new ConfirmationDialog();
        return await confirmationDialog.clickOnYesButton();
    }

//find workflow state by the display name
    async getWorkflowState(displayName) {
        let xpath = XPATH.contentSummaryByDisplayName(displayName);
        await this.waitForElementDisplayed(xpath, appConst.shortTimeout);
        let result = await this.getAttribute(xpath, 'class');
        if (result.includes('in-progress')) {
            return appConst.WORKFLOW_STATE.WORK_IN_PROGRESS;
        } else if (result.includes('ready')) {
            return appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING;
        } else if (result === 'viewer content-summary-and-compare-status-viewer') {
            return appConst.WORKFLOW_STATE.PUBLISHED;

        } else {
            throw new Error("Error when getting content's state, actual result is:" + result);
        }
    }

//find workflow state by the name
    async getWorkflowStateByName(name) {
        let xpath = XPATH.contentSummaryListViewerByName(name);
        await this.waitForElementDisplayed(xpath, appConst.shortTimeout);
        let result = await this.getAttribute(xpath, 'class');
        if (result.includes('in-progress')) {
            return appConst.WORKFLOW_STATE.WORK_IN_PROGRESS;
        } else if (result.includes('ready')) {
            return appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING;
        } else if (result === 'viewer content-summary-and-compare-status-viewer') {
            return appConst.WORKFLOW_STATE.PUBLISHED;

        } else {
            throw new Error("Error when getting content's state, actual result is:" + result);
        }
    }

    async waitForDefaultAction(actionName) {
        try {
            let selector = XPATH.contentPublishMenuButton + XPATH.defaultActionByName(actionName);
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            throw Error(`Publish Menu -  '${actionName}'  this default action should be visible!: ` + err);
        }
    }

    async clickOnDeleteAndMarkAsDeletedAndConfirm(numberItems) {
        let contentDeleteDialog = new ContentDeleteDialog();
        let confirmValueDialog = new ConfirmValueDialog();
        await this.clickOnDeleteButton();
        await contentDeleteDialog.waitForDialogOpened();

        await contentDeleteDialog.clickOnMarkAsDeletedMenuItem();
        await confirmValueDialog.waitForDialogOpened();
        await confirmValueDialog.typeNumberOrName(numberItems);
        await confirmValueDialog.clickOnConfirmButton();
        return await confirmValueDialog.waitForDialogClosed();
    }

    async openDetailsPanel() {
        let browseDetailsPanel = new BrowseDetailsPanel();
        let result = await browseDetailsPanel.isPanelVisible();
        if (!result) {
            await this.clickOnDetailsPanelToggleButton();
        }
        await browseDetailsPanel.waitForDetailsPanelLoaded();
        await browseDetailsPanel.waitForSpinnerNotVisible(appConst.TIMEOUT_5);
        await this.pause(500);
        return browseDetailsPanel;
    }

    getSelectedProjectDisplayName() {
        let selector = this.projectViewerButton + lib.H6_DISPLAY_NAME + "//span[@class='display-name']";
        return this.getText(selector);
    }

    async getContextLanguage() {
        let locator = XPATH.projectViewerButton + lib.H6_DISPLAY_NAME + "//span[@class='display-name-postfix']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }


    async waitForDeleteButtonDisabled() {
        await this.waitForElementDisplayed(this.deleteButton, appConst.mediumTimeout);
        return await this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
    }

    //Wait for 'Show Issues' button has 'Assigned to Me' label
    hasAssignedIssues() {
        return this.waitForAttributeHasValue(this.showIssuesListButton, "class", "has-assigned-issues");
    }

    async isContentInherited(contentName) {
        await this.waitForContentDisplayed(contentName, appConst.mediumTimeout);
        let locator = lib.slickRowByName(XPATH.treeGrid, contentName);
        let attr = await this.getAttribute(locator, 'class');
        return attr.includes('data-inherited');
    }

    async isContentByDisplayNameInherited(contentName) {
        await this.waitForContentDisplayed(contentName, appConst.mediumTimeout);
        let locator = lib.slickRowByDisplayName(XPATH.treeGrid, contentName);
        let attr = await this.getAttribute(locator, 'class');
        return attr.includes('data-inherited');
    }

    async clickOnLocalizeButton() {
        await this.waitForElementEnabled(this.localizeButton, appConst.mediumTimeout);
        await this.clickOnElement(this.localizeButton);
        return await this.pause(1000);
    }

    rightClickOnItemByDisplayName(displayName) {
        const nameXpath = XPATH.container + XPATH.rowByDisplayName(displayName);
        return this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout).then(() => {
            return this.doRightClick(nameXpath);
        }).catch(err => {
            throw Error(`Error when do right click on the row:` + err);
        })
    }
}

module.exports = ContentBrowsePanel;
