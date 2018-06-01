/**
 * Created on 31.05.2018.
 * Verifies: https://github.com/enonic/app-contentstudio/issues/173
 * Templates folder should be created automatically, when a site was duplicated
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const issueListDialog = require('../page_objects/issue/issue.list.dialog');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const contentDuplicateDialog = require('../page_objects/content.duplicate.dialog');
const contentBuilder = require("../libs/content.builder");

describe('site.duplicate.exclude.child.spec: Duplicate a site and exclude child specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    it(`WHEN site with content types has been added THEN the site should be listed in the grid`,
        () => {
            this.bail(1);
            let displayName = contentBuilder.generateRandomName('duplicate-site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });
    // verifies app-contentstudio/issues/173
    it(`GIVEN existing site is selected AND Duplicate dialog opened WHEN 'exclude child' icon has been pressed and 'Duplicate' clicked THEN copy of the site should be with '_templates' folder`,
        () => {
            return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
                return contentBrowsePanel.clickOnDuplicateButtonAndWait();
            }).then(() => {
                return contentDuplicateDialog.clickOnIncludeChildToggler();
            }).then(() => {
                return contentDuplicateDialog.clickOnDuplicateButton();
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName + "-copy");
            }).then(() => {
                studioUtils.saveScreenshot("site_duplicated");
                return contentBrowsePanel.clickOnExpanderIcon(SITE.displayName + "-copy");
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed('_templates');
            })
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
