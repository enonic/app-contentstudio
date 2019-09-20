/**
 * Created on 17.09.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsItemsTab = require('../../page_objects/issue/issue.details.items.tab');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('wizard.publish.menu.issue.item.spec - Publish menu(in wizard) should be updated, when new issue is created or updated',
    function () {
        this.timeout(appConst.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let TEST_FOLDER;

        // verifies https://github.com/enonic/app-contentstudio/issues/808
        // Publish Menu is not updated after an item is removed from an issue or request.
        it(`GIVEN new folder is opened WHEN new issue has been created in the wizard THEN new menu item should be added in the Publish Menu`,
            async () => {
                let contentWizard = new ContentWizard();
                let createIssueDialog = new CreateIssueDialog();
                let issueDetailsDialog = new IssueDetailsDialog();
                let issueListDialog = new IssueListDialog();
                let displayName = contentBuilder.generateRandomName('folder');
                TEST_FOLDER = contentBuilder.buildFolder(displayName);
                //Open new folder-wizard:
                await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
                await contentWizard.typeDisplayName(displayName);

                //Create a new issue: (the folder will be automatically saved)
                await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.CREATE_ISSUE);
                await createIssueDialog.typeTitle("issue1");
                await createIssueDialog.clickOnCreateIssueButton();

                //Close Issue Details dialog and Issue List dialog:
                await issueDetailsDialog.clickOnCancelTopButton();
                await issueListDialog.clickOnCancelTopButton();
                await issueListDialog.waitForDialogClosed();

                //New menu item should appear in the Wizard Publish Menu:
                await contentWizard.openPublishMenuSelectItem("issue1");
                //Issue details dialog should be loaded after clicking on the menu item:
                await issueDetailsDialog.waitForDialogOpened();
            });

        // verifies https://github.com/enonic/app-contentstudio/issues/808
        // Publish Menu is not updated after an item is removed from an issue or request.
        it(`GIVEN folder is opened AND existing issue-name has been clicked in the publish menu WHEN this folder has been excluded in the items-tab THEN this menu-item should be removed in Publish Menu`,
            async () => {
                let contentWizard = new ContentWizard();
                let issueDetailsDialog = new IssueDetailsDialog();
                let issueDetailsItemsTab = new IssueDetailsItemsTab();
                //Open existing folder:
                await studioUtils.selectContentAndOpenWizard(TEST_FOLDER.displayName);

                //expand the Publish Menu and click on the issue-name
                await contentWizard.openPublishMenuSelectItem("issue1");
                //Click on the remove icon and exclude this folder in Items:
                await issueDetailsDialog.clickOnItemsTabBarItem();
                await issueDetailsItemsTab.excludeItem(TEST_FOLDER.displayName);
                //Close the modal dialog:
                await issueDetailsDialog.clickOnCancelTopButton();
                studioUtils.saveScreenshot("publish_menu_item_hidden");

                //New menu item should not be present the Wizard Publish Menu:
                let result = await contentWizard.isPublishMenuItemPresent("issue1");
                assert.isFalse(result, "'issue1' menu item should not be present in the Publish Menu");
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    });
