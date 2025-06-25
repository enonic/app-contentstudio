/**
 * Created on 18.02.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
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

    it('Preconditions: test folder should be created',
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it('Preconditions: test site should be created', async () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
        await studioUtils.doAddSite(SITE);
    });

    it(`GIVEN browse panel is loaded WHEN no selected items THEN 'CREATE TASK...' button should appear in the browse-toolbar`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        await contentBrowsePanel.waitForCreateIssueButtonDisplayed();
    });

    it(`WHEN existing folder(New and Ready for publishing) has been selected THEN 'Publish' button should appear in the browse-toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 2. Click on 'Mark As Ready' then close the 'Publish wizard':
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            // 3. open Publish Menu and verify status of all menu items:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot('publish_menu_Folder_ready');
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.MARK_AS_READY);
            // 4.  do publish the folder:
            await studioUtils.openDialogAndPublishSelectedContent();
            // 5. Verify the status in the browse panel:
            let status = await contentBrowsePanel.getContentStatus(FOLDER.displayName);
            assert.equal(status, appConst.CONTENT_STATUS.ONLINE, 'The folder should be Online');
        });

    it(`GIVEN existing 'published' folder WHEN publish menu has been expanded THEN 'Unpublish' and 'Create Task...' menu items should be enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 2. Open Publish Menu and verify status of all menu items:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot('publish_menu_Folder_published');
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.UNPUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.MARK_AS_READY);
        });

    it(`WHEN existing folder has been unpublished THEN status of menu items should be updated`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 2. Click on 'UNPUBLISH' then close the 'Unpublish dialog':
            await contentBrowsePanel.clickOnUnpublishButton();
            let contentUnpublishDialog = new ContentUnpublishDialog();
            await contentUnpublishDialog.waitForDialogOpened();
            await contentUnpublishDialog.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogClosed();
            // 3. Open Publish Menu and verify status of all menu items:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot('publish_menu_Folder_unpublished');
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.MARK_AS_READY);
        });

    it(`WHEN site(Ready for publishing) has been published (children were not included) THEN 'PUBLISH TREE...' button should appear in the browse-toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            //site has been published and children are not included
            await studioUtils.doPublish(SITE.displayName);
            //'PUBLISH TREE...' button should appear in browse-toolbar
            await contentBrowsePanel.waitForPublishTreeButtonVisible();
        });

    it(`GIVEN existing published site has been selected WHEN 'PUBLISH TREE...' button has been pressed THEN published dependent items should not be displayed in the dialog`,
        async () => {
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
    it(`GIVEN existing published site has been selected WHEN 'PUBLISH TREE...' has been pressed THEN UNPUBLISH gets visible in the browse toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            //'PUBLISH TREE...' button has been pressed then Publish Now pressed
            await studioUtils.doPublishTree();
            //'UNPUBLISH...' button should appear in browse-toolbar
            await contentBrowsePanel.waitForUnPublishButtonVisible();
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
