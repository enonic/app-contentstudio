/**
 * Created on 17.09.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsItemsTab = require('../../page_objects/issue/issue.details.items.tab');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');

describe('wizard.publish.menu.issue.item.spec - tests for Publish menu in wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    const ISSUE_TITLE = 'issue1';

    // verifies https://github.com/enonic/app-contentstudio/issues/808
    // Publish Menu is not updated after an item is removed from an issue or request.
    it(`GIVEN new folder is opened WHEN new task has been created in the wizard THEN new menu item should be added in the Publish Menu`,
        async () => {
            let contentWizard = new ContentWizard();
            let createIssueDialog = new CreateIssueDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // Open new folder-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName);
            // Create a new issue: (the folder will be automatically saved)
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.CREATE_ISSUE);
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            await createIssueDialog.clickOnCreateIssueButton();
            // Close Issue Details dialog and Issue List dialog:
            await issueDetailsDialog.clickOnCancelTopButton();
            await issueDetailsDialog.waitForDialogClosed();
            await issueListDialog.waitForDialogClosed();
            await contentWizard.pause(1000);
            // New menu item should appear in the Wizard Publish Menu:
            await contentWizard.openPublishMenuSelectItem(ISSUE_TITLE);
            // Issue details dialog should be loaded after clicking on the menu item:
            await issueDetailsDialog.waitForDialogLoaded();
        });

    // verifies Task Details Dialog switches to the Comments tab after save #1571
    // verifies https://github.com/enonic/app-contentstudio/issues/808
    // Publish Menu is not updated after an item is removed from an issue or request.
    it(`GIVEN folder is opened AND existing issue-name has been clicked in the publish menu WHEN this folder has been excluded in the items-tab THEN this menu-item should be removed in Publish Menu`,
        async () => {
            let contentWizard = new ContentWizard();
            let taskDetailsDialog = new IssueDetailsDialog();
            let issueDetailsItemsTab = new IssueDetailsItemsTab();
            // 1. Open existing folder:
            await studioUtils.selectContentAndOpenWizard(TEST_FOLDER.displayName);
            // 2. Expand Publish Menu in the wizard and click on the issue-name(load the issue in modal dialog):
            await contentWizard.openPublishMenuSelectItem(ISSUE_TITLE);
            // 3. Click on the remove icon and exclude this folder in Items:
            await taskDetailsDialog.clickOnItemsTabBarItem();
            await issueDetailsItemsTab.excludeItem(TEST_FOLDER.displayName);
            await taskDetailsDialog.pause(1000);
            // 4. Verify that Items tab remains active:
            let isActive = await taskDetailsDialog.isItemsTabBarItemActive();
            assert.ok(isActive, 'Items tab remains active');
            // 5. Close the modal dialog:
            await taskDetailsDialog.clickOnCancelTopButton();
            await studioUtils.saveScreenshot('publish_menu_item_hidden');
            // 6. Expand Publish Menu in wizard and verify that task-name is not present in the menu:
            let result = await contentWizard.isPublishMenuItemPresent(ISSUE_TITLE);
            assert.ok(result === false, "'issue1' menu item should not be present in the Publish Menu");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
