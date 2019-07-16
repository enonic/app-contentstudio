/**
 * Created on 16.07.2019.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");

describe('Browse panel, toolbar spec. Check state of buttons after closing a wizard`', function () {
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
            await studioUtils.doAddSite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            let folderName = contentBuilder.generateRandomName('folder');
            let folder = contentBuilder.buildFolder(folderName);
            // opens folder-wizard, types a name and saves it then closes the wizard.
            await studioUtils.doAddFolder(folder);
            //Publish button should be displayed on the toolbar after closing a wizard with child content
            await contentBrowsePanel.waitForPublishButtonVisible();
            //Edit button should be enabled
            await contentBrowsePanel.waitForEditButtonEnabled();
            //Delete button should be enabled
            await contentBrowsePanel.waitForDeleteButtonEnabled();
            //Move button should be enabled
            await contentBrowsePanel.waitForMoveButtonEnabled();
        });

    it(`GIVEN existing site is selected AND new folder has been added WHEN the site has been published THEN 'Publish Tree' button should appear on the toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            let folderName = contentBuilder.generateRandomName('folder');
            let folder = contentBuilder.buildFolder(folderName);
            // opens folder-wizard, types a name and saves it then closes the wizard.
            await studioUtils.doAddFolder(folder);
            //do publish the site
            await studioUtils.doPublish();
            //'Publish tree' button  gets visible
            await contentBrowsePanel.waitForPublishTreeButtonVisible();
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});