/**
 * Created on 21.01.2019.
 * verifies : app-contentstudio#43 Cancel button should be enabled, when site has invalid items
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('publish.dialog.site.with.children.spec - Select a site with not valid child and try to publish it', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    it("Precondition: site should be added",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP]);
            await studioUtils.doAddSite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
        });

    it(`GIVEN existing site with not valid folder is selected WHEN 'Publish Dialog' has been opened  AND 'include child' pressed THEN 'Publish Now' button gets disabled`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Add no valid child:
            await addNotValidFolder(SITE.displayName);
            //2. Site should be Read for publishing:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            //3. Site is selected, open Publish dialog:
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            //4. Include not valid child:
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            //'Publish Now' button gets disabled:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });

    function addNotValidFolder() {
        return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
            return studioUtils.openContentWizard(appConstant.contentTypes.FOLDER);
        }).then(() => {
            return studioUtils.doCloseWizardAndSwitchToGrid();
        });
    }
});
