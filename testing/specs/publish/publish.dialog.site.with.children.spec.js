/**
 * Created on 21.01.2019.
 * verifies : app-contentstudio#43 Cancel button should be enabled, when site has invalid items
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const contentPublishDialog = require('../../page_objects/content.publish.dialog');


describe('publish.dialog.site.with.children.spec - Select a site with not valid child and try to publish it`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    it(`Precondition: site should be added`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });
    //verifies : app-contentstudio#43 Cancel button should be enabled, when site has invalid items
    it(`GIVEN existing site with not valid folder is selected WHEN 'Publish Dialog' has been opened  AND 'include child' pressed THEN Cancel(bottom) button should be enabled`,
        () => {
            return addNotValidFolder(SITE.displayName).then(() => {
            }).then(() => {
                return contentBrowsePanel.clickOnPublishButton();
            }).then(() => {
                return contentPublishDialog.waitForDialogVisible();
            }).then(() => {
                return contentPublishDialog.clickOnIncludeChildrenToogler();
            }).then(() => {
                return contentPublishDialog.waitForCancelButtonBottomEnabled();
            })
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
