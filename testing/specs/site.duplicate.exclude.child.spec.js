/**
 * Created on 31.05.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentDuplicateDialog = require('../page_objects/content.duplicate.dialog');
const contentBuilder = require("../libs/content.builder");

describe('site.duplicate.exclude.child.spec:  select a site exclude child and duplicate the site', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let folder;
    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN existing site is selected WHEN child folder has been added THEN it should be present in the grid`,
        () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let folderName = contentBuilder.generateRandomName('folder');
            folder = contentBuilder.buildFolder(folderName);
            return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
                return studioUtils.doAddFolder(folder);
            }).then(() => {
                return studioUtils.typeNameInFilterPanel(folder.displayName);
            }).then(() => {
                studioUtils.saveScreenshot("child_to_duplicate");
                return contentBrowsePanel.waitForContentDisplayed(folder.displayName);
            })
        });
    it(`GIVEN existing site is selected AND 'Duplicate dialog' is opened WHEN child items have not excluded AND 'Duplicate' clicked THEN the site should be copied with children`,
        () => {
            let contentDuplicateDialog = new ContentDuplicateDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
                return contentBrowsePanel.clickOnDuplicateButtonAndWait();
            }).then(() => {
                return contentDuplicateDialog.clickOnDuplicateButton();
            }).then(() => {
                contentDuplicateDialog.waitForDialogClosed();
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName + "-copy");
            }).then(() => {
                studioUtils.saveScreenshot("site_duplicated");
                return contentBrowsePanel.clickOnExpanderIcon(SITE.displayName + "-copy");
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed('_templates');
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(folder.displayName);
            })
        });

    it(`GIVEN existing site is selected AND Duplicate dialog opened WHEN 'exclude child' icon has been pressed and 'Duplicate' clicked THEN copy of the site should be displayed without expander`,
        () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
                return contentBrowsePanel.clickOnDuplicateButtonAndWait();
            }).then(() => {
                return contentDuplicateDialog.clickOnIncludeChildToggler();
            }).then(() => {
                return contentDuplicateDialog.clickOnDuplicateButton();
            }).then(() => {
                return contentDuplicateDialog.waitForDialogClosed();
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName + "-copy-2");
            }).then(() => {
                studioUtils.saveScreenshot("site_duplicated_no_child");
                return contentBrowsePanel.isExpanderIconPresent(SITE.displayName + "-copy-2");
            }).then(result => {
                assert.isFalse(result, 'Site should be displayed without a expander, because the site has no children')
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
