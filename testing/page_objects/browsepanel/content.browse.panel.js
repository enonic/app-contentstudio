/**
 * Created on 5/31/2017.
 */
const ContentDuplicateDialog = require('../content.duplicate.dialog');
const CreateIssueDialog = require('../issue/create.issue.dialog');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ConfirmationDialog = require('../confirmation.dialog');
const CreateRequestPublishDialog = require('../issue/create.request.publish.dialog');
const BrowseDetailsPanel = require('../browsepanel/detailspanel/browse.details.panel');
const BaseBrowsePanel = require('../base.browse.panel');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const ContentUnpublishDialog = require('../content.unpublish.dialog');

const XPATH = {
    container: "//div[contains(@id,'ContentBrowsePanel')]",
    toolbarDiv: "//div[contains(@id,'ContentBrowseToolbar')]",
    treeGridToolbar: "//div[contains(@id,'ListBoxToolbar') and contains(@class,'tree-grid-toolbar')]",
    selectableListBoxPanelDiv: "//div[contains(@id,'SelectableListBoxPanel')]",
    contentsTreeGridRootUL: "//ul[contains(@id,'ContentsTreeGridRootList')]",
    appBar: "//div[contains(@id,'AppBar')]",
    projectViewerButton: "//div[contains(@id,'ProjectViewer')]",
    highlightedRow: `//div[contains(@class,'checkbox-left selected') and not(contains(@class,'checked')) ]`,
    checkedRowLi: `//div[contains(@class,'checkbox-left selected checked')]`,
    searchButton: "//button[contains(@class, 'icon-search')]",
    hideSearchPanelButton: "//span[contains(@class, 'hide-filter-panel-button')]",
    showIssuesListButton: "//button[contains(@id,'ShowIssuesDialogButton')]",//'Assigned to Me' or 'Show Issues'
    createIssueMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Create Issue...']",
    markAsReadyMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Mark as ready']",
    requestPublishMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Request Publish']",
    contentPublishMenuButton: `//div[contains(@id,'ContentBrowsePublishMenuButton')]`,
    selectionControllerCheckBox: `//div[contains(@id,'ListSelectionController')]`,
    contentActionMenuButton: `//div[contains(@id,'ContentActionMenuButton')]`,
    numberInSelectionToggler: `//button[contains(@id,'SelectionPanelToggler')]/span`,
    contentSummaryListViewerByName(name) {
        return `//div[contains(@id,'ContentSummaryListViewer') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
    },
    publishMenuItemByName(name) {
        return `//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and contains(.,'${name}')]`
    },
    defaultActionByName: name => `//button[contains(@id, 'ActionButton') and child::span[contains(.,'${name}')]]`,
    foldButtonByName: name => `//div[contains(@id,'ContentBrowseToolbar')]//span[text()='${name}']`,
};

class ContentBrowsePanel extends BaseBrowsePanel {

    get treeGridToolbar() {
        return XPATH.treeGridToolbar;
    }

    get toolbar() {
        return XPATH.toolbarDiv;
    }

    get archiveButton() {
        return XPATH.toolbarDiv + lib.actionButton('Archive...');
    }

    get moreButton() {
        return XPATH.toolbarDiv + lib.BUTTONS.MORE_BUTTON;
    }

    get moveButton() {
        return XPATH.toolbarDiv + lib.actionButton('Move...');
    }

    get duplicateButton() {
        return XPATH.toolbarDiv + lib.actionButton('Duplicate...');
    }

    get sortButton() {
        return XPATH.toolbarDiv + lib.actionButton('Sort...');
    }

    get localizeButton() {
        return XPATH.toolbarDiv + lib.actionButton('Localize');
    }

    get openButton() {
        return XPATH.toolbarDiv + lib.actionButton('Open');
    }

    get searchButton() {
        return XPATH.toolbarDiv + XPATH.searchButton;
    }

    get hideSearchPanelButton() {
        return "//div[contains(@id,'ContentBrowseFilterPanel')]" + XPATH.hideSearchPanelButton;
    }

    get detailsPanelToggleButton() {
        return XPATH.container + lib.DETAILS_PANEL_TOGGLE_BUTTON;
    }

    get showPublishMenuButton() {
        return XPATH.toolbarDiv + XPATH.contentActionMenuButton + lib.DROP_DOWN_HANDLE;
    }

    get createIssueMenuItem() {
        return XPATH.toolbarDiv + XPATH.createIssueMenuItem;
    }

    get requestPublishMenuItem() {
        return XPATH.toolbarDiv + XPATH.requestPublishMenuItem;
    }

    get markAsReadyMenuItem() {
        return XPATH.toolbarDiv + XPATH.markAsReadyMenuItem;
    }

    get createIssueButton() {
        return XPATH.toolbarDiv + lib.actionButton('Create Issue...');
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
        return `${XPATH.toolbarDiv}/*[contains(@id, 'ActionButton') and child::span[contains(.,'New...')]]`
    }

    get editButton() {
        return `${XPATH.toolbarDiv}/*[contains(@id, 'ActionButton') and child::span[text()='Edit']]`;
    }

    get numberInSelectionToggler() {
        return XPATH.treeGridToolbar + XPATH.numberInSelectionToggler;
    }

    get publishButton() {
        return XPATH.contentActionMenuButton + lib.actionButton('Publish...');
    }

    get unpublishButton() {

        return XPATH.contentActionMenuButton + lib.actionButton('Unpublish...');
    }

    get publishTreeButton() {
        return XPATH.contentActionMenuButton + lib.actionButton('Publish Tree...');
    }

    get markAsReadyButton() {
        return XPATH.contentActionMenuButton + lib.actionButton('Mark as ready');
    }

    get displayNames() {
        return XPATH.contentsTreeGridRootUL + lib.TREE_GRID.H6_CONTENT_DISPLAY_NAME;
    }

    get contentNames() {
        return XPATH.contentsTreeGridRootUL + lib.TREE_GRID.P_CONTENT_NAME;
    }

    get treeGrid() {
        return XPATH.container + XPATH.contentsTreeGridRootUL;
    }

    get browseToolbar() {
        return XPATH.container + XPATH.toolbarDiv;
    }

    get projectViewerButton() {
        return lib.DIV.CONTENT_APP_BAR_DIV + XPATH.projectViewerButton;
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

    // Opens menu and select the project
    async selectContext(projectDisplayName) {
        try {
            let projectSelectionDialog = await this.clickOnProjectViewerButton();
            await projectSelectionDialog.selectContext(projectDisplayName);
            await projectSelectionDialog.waitForDialogClosed();
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_context');
            throw new Error(`Error occurred during selecting the context, screenshot: ${screenshot} ` + err);
        }
    }

    hotKeyPublish() {
        return this.getBrowser().status().then(status => {
            return this.getBrowser().keys(['Control', 'Alt', 'p']);
        })
    }

    // Wait for `Publish Menu` Button gets `Publish...`
    async waitForPublishButtonVisible() {
        try {
            return await this.waitForElementDisplayed(this.publishButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_publish_button');
            throw new Error("Publish button is not visible! " + err);
        }
    }

    // Wait for `Publish Menu` Button gets 'Mark as ready'
    async waitForMarkAsReadyButtonVisible() {
        try {
            await this.waitForElementDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
            await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_mark_as_ready_button');
            throw new Error(`Mark as Ready button is not visible! screenshot:  ${screenshot} ` + err);
        }
    }

    // Wait for `Publish Menu` Button gets 'Unpublish'
    waitForUnPublishButtonVisible() {
        return this.waitForElementDisplayed(this.unpublishButton, appConst.shortTimeout).catch(err => {
            throw new Error('Unpublish button is not displayed after 2 seconds ' + err);
        })
    }

    // Wait for `Publish Menu` Button gets 'Publish Tree...'
    waitForPublishTreeButtonVisible() {
        return this.waitForElementDisplayed(this.publishTreeButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_browse_publish_tree_button');
            throw new Error("'Publish Tree' button should be present on the browse-toolbar " + err);
        })
    }

    // Click on Unpublish default action and wait for modal dialog is loaded:
    async clickOnUnpublishButton() {
        try {
            await this.waitForUnPublishButtonVisible();
            await this.clickOnElement(this.unpublishButton);
            let unpublishDialog = new ContentUnpublishDialog();
            await unpublishDialog.waitForDialogOpened();
            await unpublishDialog.pause(1000);
            return unpublishDialog;
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_unpublish_button');
            throw new Error(`Browse Panel toolbar - Unpublish button screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnPublishTreeButton() {
        await this.waitForPublishTreeButtonVisible();
        return await this.clickOnElement(this.publishTreeButton);
    }

    // waits for button MARK AS READY appears on the toolbar, then click on it and confirm.
    async clickOnMarkAsReadyButtonAndConfirm() {
        await this.waitForMarkAsReadyButtonVisible();
        await this.clickOnElement(this.markAsReadyButton);
        let confirmationDialog = new ConfirmationDialog();
        await confirmationDialog.waitForDialogOpened();
        return await confirmationDialog.clickOnYesButton();
    }

    //When single content is selected, confirmation is no needed
    async clickOnMarkAsReadyButton() {
        await this.waitForMarkAsReadyButtonVisible();
        await this.clickOnElement(this.markAsReadyButton);
        return await this.pause(300);
    }

    async clickOnMoveButton() {
        try {
            await this.waitForMoveButtonEnabled();
            return await this.clickOnElement(this.moveButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_move_btn');
            throw new Error(`error when clicking on the Move button, screenshot: ${screenshot} ` + err);
        }
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

    async clickOnDetailsPanelToggleButton() {
        try {
            await this.waitForElementDisplayed(this.detailsPanelToggleButton, appConst.mediumTimeout);
            await this.clickOnElement(this.detailsPanelToggleButton);
            return await this.pause(400);
        } catch (err) {
            await this.saveScreenshot('err_click_on_details_panel_toggle');
            throw new Error(`Error when clicking on Details Panel toggler` + err);
        }
    }

    waitForShowContextPanelButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.container + lib.SHOW_CONTEXT_PANEL_BUTTON, appConst.mediumTimeout);
    }

    async clickOnShowIssuesListButton() {
        try {
            await this.waitForElementDisplayed(this.showIssuesListButton, appConst.shortTimeout);
            return await this.clickOnElement(this.showIssuesListButton);
        } catch (err) {
            throw new Error('error after clicking on the button ' + err);
        }
    }

    // Opens Filter Panel:
    async clickOnSearchButton() {
        await this.waitForSearchButtonDisplayed();
        return await this.clickOnElement(this.searchButton);
    }

    async clickOnHideSearchPanelButton() {
        await this.waitForElementDisplayed(this.hideSearchPanelButton, appConst.mediumTimeout);
        return await this.clickOnElement(this.hideSearchPanelButton);
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
            await contentDuplicateDialog.pause(700);
            return contentDuplicateDialog;
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_duplicate_btn_toolbar');
            throw new Error(`Error after clicking on the 'Duplicate' button, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForContentDisplayed(contentName, ms) {
        try {
            let timeout = ms ? ms : appConst.mediumTimeout;
            console.log("waitForContentDisplayed, timeout is:" + timeout);
            return await this.waitForElementDisplayed(XPATH.contentsTreeGridRootUL + lib.TREE_GRID.itemByName(contentName), timeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_content_displayed');
            throw new Error(`content is not displayed ! screenshot: ${screenshot} ` + err);
        }
    }

    async waitForContentNotDisplayed(contentName) {
        let locator = XPATH.contentsTreeGridRootUL + lib.itemByName(contentName)
        try {
            await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_content_should_not_be_displayed');
            throw new Error("Content is still displayed, screenshot :" + screenshot + "  " + err);
        }
    }

    waitForSearchButtonDisplayed() {
        return this.waitForElementDisplayed(this.searchButton, appConst.mediumTimeout);
    }

    waitForDetailsPanelToggleButtonDisplayed() {
        return this.waitForElementDisplayed(this.detailsPanelToggleButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_details_panel_displayed');
            throw new Error('Details Panel toggle button should be displayed, timeout: ' + err);
        })
    }

    async waitForSortButtonDisabled() {
        try {
            await this.waitForElementDisplayed(this.sortButton, appConst.mediumTimeout);
            return await this.waitForElementDisabled(this.sortButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_sort_disabled_button');
            throw new Error(`Sort button should be disabled, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForDuplicateButtonDisabled() {
        try {
            await this.waitForElementDisplayed(this.duplicateButton, appConst.mediumTimeout);
            return await this.waitForElementDisabled(this.duplicateButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_duplicate_disabled_button');
            throw new Error('Duplicate button should be disabled, timeout: ' + 3000 + 'ms')
        }
    }

    async waitForDuplicateButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.duplicateButton, appConst.mediumTimeout);
            return await this.waitForElementEnabled(this.duplicateButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_duplicate_should_be_enabled');
            throw new Error('Duplicate button should be enabled, timeout: ' + 3000 + 'ms')
        }
    }

    async waitForLocalizeButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.localizeButton, appConst.mediumTimeout);
            return await this.waitForElementEnabled(this.localizeButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_localize_enabled_button');
            throw new Error('Localize button should be enabled, timeout: ' + 3000 + 'ms')
        }
    }

    async waitForLocalizeButtonDisabled() {
        try {
            await this.waitForElementDisplayed(this.localizeButton, appConst.mediumTimeout);
            return await this.waitForElementDisabled(this.localizeButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_localize_disabled_button');
            throw new Error('Localize button should be disabled, timeout: ' + 3000 + 'ms')
        }
    }

    async waitForOpenButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.openButton, appConst.mediumTimeout);
            return await this.waitForElementEnabled(this.openButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_open_button_is_not_enabled');
            throw new Error('Open button should be disabled, timeout: ' + 3000 + 'ms')
        }
    }

    async clickOnOpenButton() {
        try {
            await this.waitForOpenButtonEnabled();
            await this.clickOnElement(this.openButton);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_browse_panel_open_button');
            throw new Error('Browse Panel: Edit button is not enabled! ' + err);
        }
    }

    waitForMoveButtonDisabled() {
        return this.waitForElementDisabled(this.moveButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_move_disabled_button');
            throw new Error('Move button should be disabled, timeout: ' + err);
        })
    }

    async waitForSortButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.sortButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_sort_enabled_button');
            throw new Error(`Sort button should be enabled, screenshot:${screenshot} ` + err);
        }
    }

    waitForMoveButtonEnabled() {
        return this.waitForElementEnabled(this.moveButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_move_enabled_button');
            throw new Error('Move button should be enabled, timeout: ' + err);
        })
    }

    async clickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = XPATH.contentsTreeGridRootUL + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_not_found');
            throw new Error('Content was not found:  ' + err);
        }
    }

    async waitForRowByNameVisible(name) {
        try {
            let nameXpath = XPATH.contentsTreeGridRootUL + lib.itemByName(name);
            await this.waitForElementDisplayed(nameXpath, appConst.longTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_content');
            throw new Error(`Content was not found: screenshot:${screenshot} ` + err);
        }
    }

    async waitForContentByDisplayNameVisible(displayName) {
        try {
            let nameXpath = XPATH.contentsTreeGridRootUL + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, 3000)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_content');
            throw new Error(`Content was not found, screenshot :${screenshot}  ` + err);
        }
    }

    async clickOnCheckboxAndSelectRowByName(name) {
        try {
            await this.clickOnCheckboxByName(name);
            await this.waitForRowCheckboxSelected(name);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_item');
            throw new Error('Row with the name ' + name + ' was not selected, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async clickCheckboxAndSelectRowByDisplayName(displayName) {
        try {
            await this.clickOnCheckboxByDisplayName(displayName);
            return await this.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_item');
            throw new Error(`Row with the displayName ${displayName} was not found. Screenshot: :${screenshot}` + err);
        }
    }

    async getNameInHighlightedRow() {
        try {
            await this.waitForElementDisplayed(XPATH.highlightedRow, appConst.shortTimeout);
            return await this.getText(XPATH.highlightedRow + lib.H6_DISPLAY_NAME);
        } catch (err) {
            throw new Error(`Error when getting name in the highlighted row ` + err);
        }
    }

    async getSortingIcon(contentName) {

        let selector = this.treeGrid + lib.TREE_GRID.itemTreeGridListElementByName(contentName) +
                       "//div[contains(@class,'content-tree-grid-sort')]";
        let elems = await this.findElements(selector);
        let sort;
        if (elems.length === 0) {
            return 'Default';
        }
        let classAttr = await elems[0].getAttribute('class');
        if (classAttr.includes('num-asc')) {
            sort = appConst.GRID_SORTING.DATE_ASC;
        } else if (classAttr.includes('num-desc')) {
            sort = appConst.GRID_SORTING.DATE_DESC
        } else if (classAttr.includes('alpha-asc')) {
            sort = appConst.GRID_SORTING.NAME_ASC;
        } else if (classAttr.includes('alpha-desc')) {
            sort = appConst.GRID_SORTING.NAME_DESC;
        } else if (classAttr.includes('icon-menu')) {
            sort = appConst.SORT_DIALOG.MENU_ITEM.MANUALLY_SORTED;
        }
        return sort;
    }

    // returns number of rows with selected checkbox:
    async getNumberOfCheckedRows() {
        try {
            let locator = XPATH.contentsTreeGridRootUL + XPATH.checkedRowLi;
            let result = await this.findElements(locator);
            return result.length;
        } catch (err) {
            throw new Error(`Error occurred during getting the number of rows with selected checkbox ` + err);
        }
    }

    // One or zero highlighted rows:
    async getNumberOfSelectedRows() {
        try {
            let locator = XPATH.contentsTreeGridRootUL + XPATH.highlightedRow;
            let result = await this.findElements(locator);
            return result.length;
        } catch (err) {
            throw new Error(`Error when getting highlighted rows ` + err);
        }
    }

    async waitForExpandToggleDisplayed(contentName) {
        try {
            let expanderIcon = this.treeGrid + lib.TREE_GRID.itemTreeGridListElementByName(contentName) + lib.TREE_GRID.EXPANDER_ICON_DIV;
            let res = await this.findElements(expanderIcon);
            if (res.length === 0) {
                throw new Error('Expander icon was not found!');
            }
            // check only the last element:
            return await res[res.length - 1].waitForDisplayed();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_expand_toggle');
            throw new Error(`Expand toggle should be displayed! screenshot: ${screenshot} ` + err);
        }
    }

    async waitForExpandToggleNotDisplayed(contentName) {
        try {
            let expanderIcon = this.treeGrid + lib.TREE_GRID.itemTreeGridListElementByName(contentName) + lib.TREE_GRID.EXPANDER_ICON_DIV;
            return await this.waitForElementNotDisplayed(expanderIcon, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_expand_toggle');
            throw new Error(`Expand toggle should not be displayed! screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnExpanderIcon(contentName) {
        try {
            let expanderIcon = this.treeGrid + lib.TREE_GRID.itemTreeGridListElementByName(contentName) + lib.TREE_GRID.EXPANDER_ICON_DIV;
            await this.waitForExpandToggleDisplayed(contentName);
            await this.clickOnElement(expanderIcon);
            return await this.pause(900);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_click_on_expander');
            throw new Error('Error occurred after clicking on expand-toggle ' + err);
        }
    }

    async isContentExpanded(contentName) {
        try {
            let divEl = this.treeGrid + lib.TREE_GRID.itemTreeGridListElementByName(contentName) + lib.TREE_GRID.EXPANDER_ICON_DIV;
            await this.waitForExpandToggleDisplayed(contentName);
            let attr = await this.getAttribute(divEl, 'class');
            return attr.includes('expanded');
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_expander_icon');
            throw new Error(`Error occurred during checking the expand-toggle, screenshot: ${screenshot} ` + err);
        }
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

    async getContentStatus(name) {
        try {
            let selector = lib.TREE_GRID.itemTreeGridListElementByName(name) + lib.TREE_GRID.CONTENT_STATUS;
            return await this.getText(selector);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_content_status');
            throw new Error(`Error occurred during getting the status of the content, screenshot: ${screenshot}  ` + err);
        }
    }

    async waitForStatus(name, expectedStatus) {
        let locator = XPATH.container + lib.TREE_GRID.itemTreeGridListElementByName(name) + lib.TREE_GRID.CONTENT_STATUS;
        await this.getBrowser().waitUntil(async () => {
            let actualStatus = await this.getText(locator);
            return actualStatus === expectedStatus;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Expected status should be " + expectedStatus});
    }

    async waitForStatusByDisplayName(displayName, expectedStatus) {
        let locator = lib.TREE_GRID.contentSummaryByDisplayName(XPATH.container, displayName) + "/.." + lib.TREE_GRID.CONTENT_STATUS;
        let res = await this.findElements(locator);
        await this.getBrowser().waitUntil(async () => {
            let actualStatus = await this.getText(locator);
            return actualStatus === expectedStatus;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Expected status should be " + expectedStatus});
    }

    waitForShowPublishMenuDropDownVisible() {
        return this.waitForElementDisplayed(this.showPublishMenuButton, appConst.mediumTimeout);
    }

    waitForCreateIssueButtonDisplayed() {
        return this.waitForElementDisplayed(this.createIssueButton, appConst.longTimeout).catch(err => {
            this.saveScreenshot('err_create_issue_button');
            throw new Error("Create Task button is not visible on the toolbar! " + err);
        });
    }

    async clickOnCreateIssueButton() {
        try {
            await this.waitForCreateIssueButtonDisplayed();
            return await this.clickOnElement(this.createIssueButton);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_click_create_issue_button');
            throw new Error("Browse Panel. Error when click on Create Issue button in the toolbar! " + err);
        }
    }

    waitUntilInvalid(selector) {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, 'class').then(result => {
                return result.includes('invalid');
            });
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Red icon should be displayed, the content is 'invalid' "});
    }

    async waitForPublishMenuItemDisabled(menuItem) {
        try {
            let selector = XPATH.toolbarDiv + XPATH.publishMenuItemByName(menuItem);
            return await this.waitForAttributeHasValue(selector, "class", "disabled");
        } catch (err) {
            await this.saveScreenshotUniqueName('err_publish_menuItem');
            throw new Error(menuItem + " should be disabled! " + err);
        }
    }

    async waitForPublishMenuItemEnabled(menuItem) {
        let selector = XPATH.toolbarDiv + XPATH.publishMenuItemByName(menuItem);
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
            let selector = XPATH.toolbarDiv + XPATH.publishMenuItemByName(menuItem);
            await this.waitForPublishMenuItemEnabled(menuItem);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_click_issue_menuItem');
            throw new Error('error when try to click on publish menu item, ' + err);
        }
    }

    async getPublishMenuItems() {
        let locator = "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem')]";
        return await this.getTextInDisplayedElements(locator);

    }

    async openPublishMenuAndClickOnCreateIssue() {
        await this.openPublishMenuSelectItem(appConst.PUBLISH_MENU.CREATE_ISSUE);
        let createIssueDialog = new CreateIssueDialog();
        return await createIssueDialog.waitForDialogLoaded();
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

    // finds workflow state by a display name
    async getWorkflowStateByDisplayName(displayName) {
        let xpath = XPATH.selectableListBoxPanelDiv + lib.TREE_GRID.contentSummaryByDisplayName(XPATH.container, displayName);
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

    // finds workflow state by a name
    async getWorkflowStateByName(name) {
        let xpath = XPATH.selectableListBoxPanelDiv + lib.TREE_GRID.contentSummaryByName(name);
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
            let selector = XPATH.contentActionMenuButton + XPATH.defaultActionByName(actionName);
            return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            throw new Error(`Publish Menu -  '${actionName}'  this default action should be visible!: ` + err);
        }
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

    //Wait for 'Show Issues' button has 'Assigned to Me' label
    async hasAssignedIssues() {
        try {
            return await this.waitForAttributeHasValue(this.showIssuesListButton, "class", "has-assigned-issues");
        } catch (err) {
            await this.saveScreenshotUniqueName('err_issues');
            throw new Error("'Assigned to Me' button should be displayed  " + err);
        }
    }

    waitForAssignedToMeButtonDisplayed() {
        let locator = this.showIssuesListButton + "//span[text()='Assigned to Me']";
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async isContentInherited(contentName) {
        await this.waitForContentDisplayed(contentName, appConst.mediumTimeout);
        let locator = lib.TREE_GRID.contentSummaryByName(contentName)
        let attr = await this.getAttribute(locator, 'class');
        return attr.includes('data-inherited');
    }

    async isContentByDisplayNameInherited(contentDisplayName) {
        await this.waitForContentDisplayed(contentDisplayName, appConst.mediumTimeout);
        let locator = lib.TREE_GRID.contentSummaryByDisplayName(XPATH.container, contentDisplayName);
        let attr = await this.getAttribute(locator, 'class');
        return attr.includes('data-inherited');
    }

    async clickOnLocalizeButton() {
        try {
            await this.waitForElementEnabled(this.localizeButton, appConst.mediumTimeout);
            await this.clickOnElement(this.localizeButton);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_localize_btn');
            throw new Error(`Content Browse Panel, Localize button, screenshot:${screenshot} ` + err);
        }
    }

    async rightClickOnItemByDisplayName(displayName) {
        try {
            const nameXpath = XPATH.container + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.doRightClick(nameXpath);
            return await this.waitForContextMenuDisplayed();
        } catch (err) {
            await this.saveScreenshotUniqueName('err_context_menu');
            throw new Error(`Error occurred after right click on the row:` + err);
        }
    }

    waitForArchiveButtonDisplayed() {
        return this.waitForElementDisplayed(this.archiveButton, appConst.mediumTimeout);
    }

    async waitForArchiveButtonEnabled() {
        try {
            await this.waitForArchiveButtonDisplayed();
            await this.waitForElementEnabled(this.archiveButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_delete_button');
            throw new Error("Archive button should be enabled " + err);
        }
    }

    async waitForArchiveButtonDisabled() {
        await this.waitForArchiveButtonDisplayed();
        return await this.waitForElementDisabled(this.archiveButton, appConst.mediumTimeout)
    }

    async clickOnArchiveButton() {
        await this.waitForArchiveButtonEnabled();
        await this.clickOnElement(this.archiveButton);
        return await this.pause(500);
    }

    getDisplayNameInHighlightedRow() {
        let locator = XPATH.highlightedRow + lib.H6_DISPLAY_NAME;
        return this.getText(locator);
    }

    async getNumberInSelectionToggler() {
        await this.waitForElementDisplayed(this.numberInSelectionToggler, appConst.mediumTimeout);
        return await this.getText(this.numberInSelectionToggler);
    }

    waitForMoreButtonDisplayed() {
        return this.waitForElementDisplayed(this.moreButton, appConst.mediumTimeout);
    }

    async clickOnMoreFoldButton() {
        await this.waitForMoreButtonDisplayed();
        await this.clickOnElement(this.moreButton);
        return this.pause(200);
    }

    waitForFoldWithNameButtonDisplayed(name) {
        return this.waitForElementDisplayed(XPATH.foldButtonByName(name));
    }

    async clickOnFoldWithNameButton(name) {
        await this.waitForFoldWithNameButtonDisplayed(name);
        return await this.clickOnElement(XPATH.foldButtonByName(name));
    }

    async waitForSortIconNotDisplayed(name) {
        let selector = lib.TREE_GRID.itemTreeGridListElementByName(name) + lib.TREE_GRID.SORT_DIALOG_TOGGLE;
        return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
    }

    async waitForSortIconDisplayed(name) {
        let selector = lib.TREE_GRID.itemTreeGridListElementByName(name) + lib.TREE_GRID.SORT_DIALOG_TOGGLE;
        return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
    }

    async waitForGridRoleAttribute(expectedRole) {
        let locator = XPATH.treeGrid;
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(locator, "role");
            return text === expectedRole;
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Role attribute for Grid should set 'grid'"});
    }

    async waitForShowIssuesButtonAriaHasPopupAttribute(expectedValue) {
        let locator = this.showIssuesListButton;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ARIA_HAS_POPUP, expectedValue);
    }

    async waitForPublishMenuRoleAttribute(expectedRole) {
        let locator = XPATH.contentActionMenuButton;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ROLE, expectedRole);
    }

    async getContentNamesInGrid() {
        return await this.getTextInDisplayedElements(this.contentNames);
    }
}

module.exports = ContentBrowsePanel;
