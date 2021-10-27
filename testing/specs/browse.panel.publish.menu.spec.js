/**
 * Created on 18.02.2019.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentUnpublishDialog = require('../page_objects/content.unpublish.dialog');

describe('browse.panel.publish.menu.spec tests for Publish button in grid-toolbar`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let FOLDER;

    it(`Preconditions: test folder should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it(`Preconditions: test site should be created`, async () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
        await studioUtils.doAddSite(SITE);
    });

    it(`GIVEN browse panel is loaded WHEN no selected items THEN 'CREATE TASK...' button should appear in the browse-toolbar`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        await contentBrowsePanel.waitForCreateTaskButtonDisplayed();
    });

    it(`WHEN existing folder(New and Ready to publish) has been selected THEN 'Publish' button should appear in the browse-toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            //2. Click on Mark As Ready:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            // open Publish Menu and verify status of all menu items:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot("publish_menu_Folder_ready");
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.CREATE_TASK);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.REQUEST_PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.PUBLISH_TREE);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.MARK_AS_READY);
            //3.  do publish the folder:
            await studioUtils.doPublish();
            let status = await contentBrowsePanel.getContentStatus(FOLDER.displayName);
            assert.equal(status, appConstant.CONTENT_STATUS.PUBLISHED, "The folder should be Published");
        });

    it(`GIVEN existing 'published' folder WHEN publish menu has been expanded THEN 'Unpublish' and 'Create Task...' menu items should be enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);

            //2. Open Publish Menu and verify status of all menu items:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot("publish_menu_Folder_published");
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.UNPUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.CREATE_TASK);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.PUBLISH_TREE);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.MARK_AS_READY);
        });

    it(`WHEN existing folder has been unpublished THEN status of menu items should be updated`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            //2. Click on Mark As Ready:
            await contentBrowsePanel.clickOnUnpublishButton();
            let contentUnpublishDialog = new ContentUnpublishDialog();
            await contentUnpublishDialog.waitForDialogOpened();
            await contentUnpublishDialog.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogClosed();
            // open Publish Menu and verify status of all menu items:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot("publish_menu_Folder_unpublished");
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.CREATE_TASK);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.REQUEST_PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.PUBLISH);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.PUBLISH_TREE);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.MARK_AS_READY);
        });

    it(`WHEN site(Ready to publish) has been published (children were not included) THEN 'PUBLISH TREE...' button should appear in the browse-toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            //site has been published and children are not included
            await studioUtils.doPublish(SITE.displayName);
            //'PUBLISH TREE...' button should appear in browse-toolbar
            await contentBrowsePanel.waitForPublishTreeButtonVisible();
        });

    //test verifies https://github.com/enonic/app-contentstudio/issues/493
    it(`GIVEN existing published site has been selected WHEN 'PUBLISH TREE...' has been pressed THEN UNPUBLISH gets visible in the browse toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            //PUBLISH TREE.. button has been pressed then Publish Now pressed
            await studioUtils.doPublishTree();
            //'UNPUBLISH...' button should appear in browse-toolbar
            await contentBrowsePanel.waitForUnPublishButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
