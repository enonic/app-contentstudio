/**
 * Created on 16.07.2019.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");

describe('Browse panel, toolbar spec. Check state of buttons after closing a wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    //verifies https://github.com/enonic/app-contentstudio/issues/645
    //Buttons on toolbar are not correctly updated after closing a content-wizard
    it(`GIVEN existing site is selected  AND 'New' button has been pressed WHEN new folder has been saved and the wizard closed THEN toolbar-buttons should be in expected state`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site-test');
            SITE = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddReadySite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            let folderName = contentBuilder.generateRandomName('folder');
            let folder = contentBuilder.buildFolder(folderName);
            // opens folder-wizard, types a name and saves it then closes the wizard.
            await studioUtils.doAddFolder(folder);
            //'Publish' button should be displayed on the toolbar after closing a wizard with child content
            await contentBrowsePanel.waitForPublishButtonVisible();
            //'Edit' button should be enabled
            await contentBrowsePanel.waitForEditButtonEnabled();
            //'Delete' button should be enabled
            await contentBrowsePanel.waitForDeleteButtonEnabled();
            //'Move' button should be enabled
            await contentBrowsePanel.waitForMoveButtonEnabled();
        });

    it(`GIVEN existing site is selected WHEN the site (children are not included) has been published THEN 'Publish Tree' button should appear on the toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            //do publish the site(children are not included)
            await studioUtils.doPublish();
            //'Publish tree' button  gets visible
            await contentBrowsePanel.waitForPublishTreeButtonVisible();
        });

    it(`WHEN no selected content THEN all buttons on the toolbar should be in expected state`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.waitForNewButtonEnabled();
            await contentBrowsePanel.waitForEditButtonDisabled();
            await contentBrowsePanel.waitForDeleteButtonDisabled();
            await contentBrowsePanel.waitForDuplicateButtonDisabled();
            await contentBrowsePanel.waitForMoveButtonDisabled();
            await contentBrowsePanel.waitForSortButtonDisabled();
            await contentBrowsePanel.waitForPreviewButtonDisabled();
            await contentBrowsePanel.waitForCreateTaskButtonDisplayed();
            await contentBrowsePanel.waitForDetailsPanelToggleButtonDisplayed();
        });

    it(`WHEN image is selected (not allowing children) THEN 'Sort' and 'New' buttons should be  disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(appConstant.TEST_IMAGES.HAND);
            await contentBrowsePanel.waitForEditButtonEnabled();
            await contentBrowsePanel.waitForSortButtonDisabled();
            //New button should be disabled, because children are not allowed for images.
            await contentBrowsePanel.waitForNewButtonDisabled();
            await contentBrowsePanel.waitForPreviewButtonDisabled();
        });

    it(`GIVEN new folder is added WHEN the folder has been selected THEN 'Sort' buttons should be disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            let folder = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(folder);
            await studioUtils.findAndSelectItem(folder.displayName);
            await contentBrowsePanel.waitForEditButtonEnabled();
            //'Sort' button should be disabled, because this folder is empty!
            await contentBrowsePanel.waitForSortButtonDisabled();
            //'New' button should be enabled, because children are allowed for folder-content.
            await contentBrowsePanel.waitForNewButtonEnabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});