/**
 * Created on 29.02.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentBrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.details.panel');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentSettingsForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');

describe('versions.widget.check.status.spec - check content status in Versions Panel`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let FOLDER;

    it(`GIVEN existing folder is selected then it has been published WHEN Version Panel has been opened THEN 'Published' status should be in the latest version-item`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            //1. add new folder and do publish one
            await studioUtils.doAddReadyFolder(FOLDER);
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.doPublish();
            let actualMessage = await contentBrowsePanel.waitForNotificationMessage();
            let expectedMessage = appConstant.itemPublishedNotificationMessage(FOLDER.displayName);
            assert.equal(actualMessage, expectedMessage, "Item is published - message should appear");
            //2. Verify the default action in Publish menu:
            await contentBrowsePanel.waitForUnPublishButtonVisible();
            //3. Verify that 'publish menu' is available:
            await contentBrowsePanel.waitForShowPublishMenuDropDownVisible();
            //4. Open version panel and verify status in the top version-item:
            await contentBrowsePanel.openDetailsPanel();
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.waitForVersionsLoaded();
            await browseVersionsWidget.waitForVersionItemPublished(0);
            let status = await browseVersionsWidget.getContentStatus(0);
            assert.equal(status, appConstant.CONTENT_STATUS.PUBLISHED, "'Published' status should be in the top version item");
        });

    it(`GIVEN existing folder(Published) has been modified WHEN Version Panel has been opened THEN 'Modified' status should be in the top version-item`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let contentSettingsForm = new ContentSettingsForm();
            let contentWizard = new ContentWizard();
            //1. open the folder and select the language:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentSettingsForm.filterOptionsAndSelectLanguage('English (en)');
            await contentWizard.hotKeySaveAndCloseWizard();
            //2. Open version panel and verify status in the latest version-item:
            await contentBrowsePanel.openDetailsPanel();
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.waitForVersionsLoaded();
            let status = await browseVersionsWidget.getContentStatus(0);
            assert.equal(status, appConstant.CONTENT_STATUS.MODIFIED, "'Modified' status should be in the top version item");
        });

    it(`GIVEN existing folder(Modified) has been deleted WHEN Version Panel has been opened THEN 'Deleted' status should be in the latest version`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            //1. Select the folder and click on 'Mark as Deleted'
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.doSelectedContentMarkAsDeleted();
            //2. Open version panel and verify status in the top version-item:
            await contentBrowsePanel.openDetailsPanel();
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.waitForVersionsLoaded();
            let status = await browseVersionsWidget.getContentStatus(0);
            assert.equal(status, appConstant.CONTENT_STATUS.DELETED, "'Deleted' status should be in the top version item");
        });

    it(`GIVEN existing folder(Deleted) is selected and 'Undo delete' button pressed WHEN Version Panel has been opened THEN 'Modified' status should be in the latest version`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            //1. Select the folder and click on 'Undo delete'
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.clickOnUndoDeleteButton();
            let actualMessage = await contentBrowsePanel.waitForNotificationMessage();
            let expectedMessage = "Item is undeleted";
            assert.equal(actualMessage, expectedMessage, "'Item is undeleted' - message should appear");
            //2. Open version panel and verify status in the top version-item:
            await contentBrowsePanel.openDetailsPanel();
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.waitForVersionsLoaded();
            let status = await browseVersionsWidget.getContentStatus(0);
            assert.equal(status, appConstant.CONTENT_STATUS.MODIFIED, "'Modified' status should be in the top version item");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
