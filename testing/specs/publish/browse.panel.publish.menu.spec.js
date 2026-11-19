/**
 * Created on 18.02.2019.  updated on 19.11.2026
 * 'Mark as ready' is removed from the browse-toolbar publish button (#11791),
 * so content is marked as ready in the Publish dialog.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const ContentUnpublishDialog = require('../../page_objects/content.unpublish.dialog');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('browse.panel.publish.menu.spec tests for Publish button in grid-toolbar', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let FOLDER;
    const CHILD_FOLDER_NAME = appConst.generateRandomName('childFolder');

    it('Preconditions: test folder should be created', async () => {
        let displayName = contentBuilder.generateRandomName('folder');
        FOLDER = contentBuilder.buildFolder(displayName);
        await studioUtils.doAddFolder(FOLDER);
    });

    it('Preconditions: test site should be created', async () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, null, ['All Content Types App']);
        await studioUtils.doAddSite(SITE);
    });

    it(`GIVEN browse panel is loaded WHEN no selected items THEN 'CREATE Issue' button should appear in the browse-toolbar`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        await contentBrowsePanel.waitForCreateIssueButtonDisplayed();
    });

    it(`GIVEN 'Work in progress' folder is selected AND 'Publish...' button has been pressed in the browse-toolbar WHEN the folder has been marked as ready in the Publish dialog THEN 'Create Issue' menu item should be enabled AND the folder can be published`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        // 1. Select the 'Work in progress' folder:
        await studioUtils.findAndSelectItem(FOLDER.displayName);
        // 2. Click on 'Publish...' button in the browse-toolbar ('Mark as ready' is no longer offered in the toolbar):
        await contentBrowsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        // 3. Click on 'Mark as ready' in the Publish dialog, then close the dialog:
        await contentPublishDialog.clickOnMarkAsReadyButton();
        await contentPublishDialog.clickOnCloseButton();
        await contentPublishDialog.waitForDialogClosed();
        // 4. Open Publish Menu and verify the state of the menu items:
        await contentBrowsePanel.openPublishMenu();
        await studioUtils.saveScreenshot('publish_menu_Folder_ready');

        await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
        await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH_TREE);
        // 5. Publish the folder:
        await studioUtils.openDialogAndPublishSelectedContent();
        // 6. Verify the status in the browse panel:
        let status = await contentBrowsePanel.getContentStatus(FOLDER.displayName);
        assert.equal(status, appConst.CONTENT_STATUS.ONLINE, 'The folder should be Online');
    });

    it(`GIVEN existing 'online' folder is selected WHEN publish menu has been expanded THEN only 'Create Issue' menu item should be enabled`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Select the published folder:
        await studioUtils.findAndSelectItem(FOLDER.displayName);
        // 2. Open Publish Menu and verify: 'Create Issue' is enabled, 'Request Publish' and 'Publish Tree' are disabled:
        await contentBrowsePanel.openPublishMenu();
        await studioUtils.saveScreenshot('publish_menu_Folder_published');
        await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
        await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH_TREE);
    });

    it(`GIVEN existing 'online' folder is selected WHEN the folder has been unpublished THEN 'Create Issue' and 'Request Publish' menu items should be enabled AND 'Publish Tree' should be disabled`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Select the published folder:
        await studioUtils.findAndSelectItem(FOLDER.displayName);
        // 2. Click on 'UNPUBLISH...' button and confirm it in the 'Unpublish dialog':
        await contentBrowsePanel.clickOnUnpublishButton();
        let contentUnpublishDialog = new ContentUnpublishDialog();
        await contentUnpublishDialog.waitForDialogOpened();
        await contentUnpublishDialog.clickOnUnpublishButton();
        await contentUnpublishDialog.waitForDialogClosed();
        // 3. Open Publish Menu and verify the state of the menu items:
        await contentBrowsePanel.openPublishMenu();
        await studioUtils.saveScreenshot('publish_menu_Folder_unpublished');
        await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
        await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH_TREE);
    });

    it(`GIVEN 'Work in progress' site is selected WHEN the site has been marked as ready in the Publish dialog and published (children were not included) THEN 'PUBLISH TREE...' button should appear in the browse-toolbar`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Select the 'Work in progress' site:
        await studioUtils.findAndSelectItem(SITE.displayName);
        // 2. Click on 'Publish...' button in the browse-toolbar:
        await contentBrowsePanel.clickOnPublishButton();
        let contentPublishDialog = new ContentPublishDialog();
        await contentPublishDialog.waitForDialogOpened();
        // 3. Click on 'Mark as ready' in the Publish dialog, then publish the site (children are not included):
        await contentPublishDialog.clickOnMarkAsReadyButton();
        await contentPublishDialog.clickOnPublishNowButton();
        await contentPublishDialog.waitForDialogClosed();
        // 4. 'PUBLISH TREE...' button should appear in the browse-toolbar:
        await contentBrowsePanel.waitForPublishTreeButtonVisible();
    });

    it(`GIVEN existing published site has been selected WHEN 'PUBLISH TREE' button has been pressed THEN published dependent items should not be displayed in the dialog`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentWizard = new ContentWizard();
        let contentPublishDialog = new ContentPublishDialog();
        // 1. Select the published site:
        await studioUtils.findAndSelectItem(SITE.displayName);
        // 2. Add a child folder:
        await contentBrowsePanel.clickOnNewButton();
        await studioUtils.clickOnItemInNewContentDialog(appConst.contentTypes.FOLDER);
        await contentWizard.typeDisplayName(CHILD_FOLDER_NAME);
        await contentWizard.clickOnMarkAsReadyButton();
        await contentPublishDialog.waitForDialogOpened();
        // 3. Publish the child folder:
        await contentPublishDialog.clickOnPublishNowButton();
        await contentPublishDialog.waitForDialogClosed();
        // 4. Close the folder wizard:
        await studioUtils.doCloseWindowTabAndSwitchToBrowsePanel();
        // 5. Click on 'PUBLISH TREE...' button:
        await contentBrowsePanel.clickOnPublishTreeButton();
        // 6. Verify that published dependent items are not included(displayed) in the list:
        await contentPublishDialog.waitForDialogOpened();
        let actualItems = await contentPublishDialog.getDisplayNameInDependentItems();
        assert.equal(actualItems.length, 1, 'The list should contain only one item');
        assert.ok(actualItems[0].includes('_templates'), 'The list of items should contains only one item');
    });

    //test verifies https://github.com/enonic/app-contentstudio/issues/493
    it(`GIVEN existing published site has been selected WHEN 'PUBLISH TREE' has been pressed and the tree has been published THEN 'UNPUBLISH...' button gets visible in the browse-toolbar`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Select the published site:
        await studioUtils.findAndSelectItem(SITE.displayName);
        // 2. Click on 'PUBLISH TREE...' button, then click on 'Publish Now' in the dialog:
        await studioUtils.doPublishTree();
        // 3. 'UNPUBLISH...' button should appear in the browse-toolbar:
        await contentBrowsePanel.waitForUnPublishButtonVisible();
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
