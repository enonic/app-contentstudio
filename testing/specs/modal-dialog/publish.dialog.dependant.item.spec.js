/**
 * Created on 09.03.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('publish.dialog.dependant.items.spec: tests for dependant items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let TEMPLATE;
    let SUPPORT = 'Folder';
    let CONTROLLER_NAME = 'Page';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`Precondition: new template(supports article) should be added`,
        async () => {
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT, CONTROLLER_NAME);
            await studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE);
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/5989
    //  Exclude items in progress must be hidden if all dependant items are required
    it(`GIVEN work in progress template is selected WHEN Publish Wizard has been opened THEN 'Exclude items in progress' button should not be visible`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the 'work in progress' template:
            await studioUtils.findAndSelectItem(TEMPLATE.displayName);
            // 2. Open Publish Wizard dialog:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('publish_wizard_exclude_in_progress_hidden');
            // 3. Verify that 'Exclude items in progress' is hidden because both items are required:
            await contentPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
            // 4. 'Publish now' button should be disabled:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            // 5. Verify items in dependant items block:
            let items = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(items.length, 2, 'Two dependant items should be displayed');
            let expectedItem = '/' + SITE.displayName + '/' + '_templates';
            assert.isTrue(items.includes(expectedItem), "Expected items should be displayed in dependants items");
            // 6. Verify that 'All' checkbox is not clickable(disabled), all items are requred for publishing:
            await contentPublishDialog.waitForAllDependantsCheckboxDisabled();
        });

    it(`GIVEN Publish Wizard has been opened WHEN 'Mark as ready' button has been pressed THEN 'Publish now' button gets enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the existing 'work in progress' template:
            await studioUtils.findAndSelectItem(TEMPLATE.displayName);
            // 2. Open Publish Wizard:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Click on 'Mark as ready' button in the dialog:
            await contentPublishDialog.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            await studioUtils.saveScreenshot('publish_wizard_marked_as_ready');
            // 4. Verify that 'Publish now' button gets enabled
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            // 5. Expected text gets visible in the dialog:
            let result = await contentPublishDialog.getResolvedEntryText();
            assert.equal(result, 'Content is ready for publishing', 'Expected note appears in the dialog');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });

});
