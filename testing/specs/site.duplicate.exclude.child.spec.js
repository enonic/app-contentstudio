/**
 * Created on 31.05.2018.
 */
const chai = require('chai');
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
    let CHILD_FOLDER;
    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`Preconditions child folder should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let folderName = contentBuilder.generateRandomName('folder');
            CHILD_FOLDER = contentBuilder.buildFolder(folderName);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.doAddFolder(CHILD_FOLDER);
            await studioUtils.typeNameInFilterPanel(CHILD_FOLDER.displayName);
            await contentBrowsePanel.waitForContentDisplayed(CHILD_FOLDER.displayName);
        });

    it(`GIVEN existing site is selected AND 'Duplicate dialog' is opened WHEN site has been duplicated THEN the site should be copied with its children`,
        async () => {
            let contentDuplicateDialog = new ContentDuplicateDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select existing site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            //2. open Duplicate dialog and click on 'Duplicate' button:
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateDialog.clickOnDuplicateButton();
            await contentDuplicateDialog.waitForDialogClosed();
            //3. Verify that the site has been copied with its children:
            await studioUtils.findAndSelectItem(SITE.displayName + "-copy");
            studioUtils.saveScreenshot("site_and_children_duplicated");
            await contentBrowsePanel.clickOnExpanderIcon(SITE.displayName + "-copy");
            await contentBrowsePanel.waitForContentDisplayed('_templates');
            await contentBrowsePanel.waitForContentDisplayed(CHILD_FOLDER.displayName);
        });

    it(`GIVEN existing site is selected AND Duplicate dialog is opened WHEN 'exclude child' icon has been pressed and 'Duplicate' clicked THEN copy of the site should be displayed without expander icon`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            //1. Select the site and open Duplicate dialog:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            //2. Click on the toggler and exclude child items:
            await contentDuplicateDialog.clickOnIncludeChildToggler();
            await contentDuplicateDialog.clickOnDuplicateButton();
            await contentDuplicateDialog.waitForDialogClosed();
            //3. Verify that site does not have expander icon:
            await studioUtils.findAndSelectItem(SITE.displayName + "-copy-2");
            studioUtils.saveScreenshot("site_duplicated_no_child");
            let isDisplayed = await contentBrowsePanel.isExpanderIconPresent(SITE.displayName + "-copy-2");
            assert.isFalse(isDisplayed, 'Site should be displayed without a expander, because the site has no children');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
