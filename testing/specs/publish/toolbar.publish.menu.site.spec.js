/**
 * Created on 21.01.2019.
 * verifies : https://github.com/enonic/app-contentstudio/issues/493
 */
const chai = require('chai');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");

describe('toolbar.publish.menu.site.spec - publishes a site and checks publish menu items', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    //verifies 'Create Issue' button should not appear on the toolbar after publishing site's child items
    it(`WHEN existing site first has been published then Publish Tree actions has been performed THEN Unpublish button should appear in the toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP]);
            //1. add new site
            await studioUtils.doAddSite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            //2.  the site has been published:
            await studioUtils.doPublish();
            //'Publish Tree button should appear on the toolbar' ( exception will be thrown after the timeout)
            await contentBrowsePanel.waitForPublishTreeButtonVisible();
            //3. 'Publish Tree' menu item has been clicked and the action confirmed
            await studioUtils.doPublishTree();
            //'Unpublish button should appear on the toolbar' ( exception will be thrown after the timeout)
            await contentBrowsePanel.waitForUnPublishButtonVisible();
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
