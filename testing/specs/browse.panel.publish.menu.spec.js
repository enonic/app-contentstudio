/**
 * Created on 18.02.2019.
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

    it(`GIVEN browse panel is loaded WHEN no selected items THEN 'CREATE ISSUE...' button should appear in the browse-toolbar`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        await contentBrowsePanel.waitForCreateIssueButtonVisible();
    });

    it(`WHEN existing folder(New and Ready to publish) has been selected THEN 'Publish' button should appear in the browse-toolbar`, () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        return studioUtils.findAndSelectItem(FOLDER.displayName).then(() => {
            return contentBrowsePanel.clickOnMarkAsReadyButton();
        }).then(() => {
            // do publish the folder
            return studioUtils.doPublish();
        }).then(() => {
            return expect(contentBrowsePanel.getContentStatus(FOLDER.displayName)).to.eventually.equal('Published');
        })
    });

    it(`GIVEN existing 'published' folder WHEN publish menu has been expanded THEN 'Request Publishing...' menu item should be disabled AND 'Create Issue' is enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.waitForUnPublishButtonVisible();
            // open Publish Menu:
            await contentBrowsePanel.openPublishMenu();
            studioUtils.saveScreenshot("publish_menu_items1");
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.CREATE_ISSUE);
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.REQUEST_PUBLISH);
        });

    it(`WHEN existing published folder has been selected THEN 'UNPUBLISH...' button should appear on browse-toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.waitForUnPublishButtonVisible();
        });

    it(`WHEN site(Ready to publish) has been published (children were not included) THEN 'PUBLISH TREE...' button should appear in the browse-toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            //site has been published and children are not included
            await studioUtils.doPublish(SITE.displayName);
            //'PUBLISH TREE...' button should appear on browse-toolbar
            await contentBrowsePanel.waitForPublishTreeButtonVisible();
        });

    //test verifies https://github.com/enonic/app-contentstudio/issues/493
    it(`GIVEN existing published site has been selected WHEN 'PUBLISH TREE...' has been pressed THEN UNPUBLISH gets visible in the browse toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            //PUBLISH TREE.. button has been pressed then Publish Now pressed
            await studioUtils.doPublishTree();
            //'UNPUBLISH...' button should appear on browse-toolbar
            await contentBrowsePanel.waitForUnPublishButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
