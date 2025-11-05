/**
 * Created on 07.02.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const PropertiesWidget = require('../../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const ContentBrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');

describe('close.issue.by.user.spec: create a issue for user and close it', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;
    const ISSUE_TITLE = appConst.generateRandomName('issue');

    it(`Precondition 1: new system user should be added`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new system user:
            await studioUtils.navigateToUsersApp();
            let userName = contentBuilder.generateRandomName('user');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, appConst.SYSTEM_ROLES.CM_APP, appConst.SYSTEM_ROLES.CM_ADMIN];
            USER = contentBuilder.buildUser(userName, PASSWORD, contentBuilder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it(`GIVEN SU selects a folder and opens 'Create Issue...' dialog WHEN new issue has been assigned to the just created user THEN new issue should be loaded in IssueDetailsDialog`,
        async () => {
            await studioUtils.navigateToContentStudioApp()
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialog = new IssueDetailsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1.Add new folder:
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Select the folder and open Create Issue dialog:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            // 3. Assign the issue to the just created user:
            await createIssueDialog.selectUserInAssignees(USER.displayName);
            await studioUtils.saveScreenshot('issue_assigned');
            // 4. Click on 'Create Issue' button and create new issue:
            await createIssueDialog.clickOnCreateIssueButton();
            let message = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.ISSUE_CREATED_MESSAGE);
            await issueDetailsDialog.waitForDialogLoaded();
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("WHEN the user is logged in THEN 'Assigned to Me' button should be displayed in the browse toolbar",
        async () => {
            // 1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            let issueListDialog = new IssueListDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.saveScreenshot('assigned_to_me_label');
            // Verify that 'Assigned to Me' label is displayed in the Open Issues button
            await contentBrowsePanel.waitForAssignedToMeButtonDisplayed();
            // 2. Open 'Issues List' dialog:
            await studioUtils.openIssuesListDialog();
            // 3. Verify the selected option in the selector:
            let result = await issueListDialog.getTypeFilterSelectedOption();
            assert.ok(result.includes('Assigned to Me'), "'Assigned to Me' options should be selected in the filter");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN the user is logged in WHEN the user closed his issue THEN the issue should be 'Closed' in the issue details dialog",
        async () => {
            // 1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            // 2. Open Issues List dialog:
            await studioUtils.openIssuesListDialog();
            // 3. Click on the issue and load Issue Details Dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 4. Expand the status selector
            await issueDetailsDialog.clickOnStatusSelectorMenu();
            // 5. Click on "Closed" menu item:
            await issueDetailsDialog.clickOncloseTabMenuItem();
            await studioUtils.saveScreenshot('issue_closed');
            // 6. Verify that 'The Issue is closed' the notification message appears:
            await issueDetailsDialog.waitForExpectedNotificationMessage(appConst.NOTIFICATION_MESSAGES.ISSUE_CLOSED_MESSAGE);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it(`GIVEN SU is logged in WHEN the issue, just closed by the user has been loaded in issue details dialog THEN 'closed by' info should be present`,
        async () => {
            // 1. SU is logged in:
            await studioUtils.navigateToContentStudioApp()
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            // 2. SU opens 'Issues List' dialog:
            await studioUtils.openIssuesListDialog();
            // 3. Open 'Closed' issues tab:
            await issueListDialog.clickOnClosedButton();
            // 4. Click on the issue:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            // 5. Verify the status info(title attribute):
            let info = await issueDetailsDialog.getIssueStatusInfo();
            let expectedMessage = appConst.issueClosedBy(USER.displayName);
            // 6. Verify that the info message is displayed in the status selector : "Closed by user:system:${userName}"
            assert.ok(info.includes(expectedMessage), 'Expected notification message should appear');
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN the user has selected the folder WHEN the folder has been duplicated THEN expected owner should be displayed for this folder in Properties Widget",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let propertiesWidget = new PropertiesWidget();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            // 1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select and duplicate the folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let contentDuplicateModalDialog = await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateModalDialog.clickOnDuplicateButton();
            await contentDuplicateModalDialog.waitForDialogClosed();
            // 3. Select the copy :
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName + '-copy');
            await studioUtils.saveScreenshot('owner_copy_folder');
            // 4. Verify the owner name in the Properties widget:
            let owner = await propertiesWidget.getOwnerName();
            assert.equal(owner, USER.displayName, 'Expected user should be displayed in the widget');
            // 5. Open Versions widget:
            await contentBrowseDetailsPanel.openVersionHistory();
            // 4. Click on the 'Created' item in versions widget:
            await browseVersionsWidget.clickAndExpandVersionItemByHeader('Created');
            await studioUtils.saveScreenshot('owner_in_versions');
            // 5. Verify 'by user-name' text in the version item:
            let actualUser = await browseVersionsWidget.getUserNameInItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            assert.ok(actualUser.includes(USER.displayName), 'Expected user name should be displayed in the version list item');

            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
