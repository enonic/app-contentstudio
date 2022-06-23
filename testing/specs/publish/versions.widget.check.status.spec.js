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
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');

describe('versions.widget.check.status.spec - check content status in Versions Panel`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;

    it(`GIVEN existing folder is selected WHEN the folder has been published THEN 'Published' status should be in Version Widget`,
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
            //2. Verify the default action gets 'Unpublish' in Publish menu:
            await contentBrowsePanel.waitForUnPublishButtonVisible();
            //3. Verify that 'publish menu' is available:
            await contentBrowsePanel.waitForShowPublishMenuDropDownVisible();
            //4. Open version panel and verify status in the top version-item:
            await contentBrowsePanel.openDetailsPanel();
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.waitForVersionsLoaded();
            //5. Verify that 'Published' list-item appears in the widget:
            await browseVersionsWidget.waitForPublishedWidgetItemVisible();
            let status = await browseVersionsWidget.getContentStatus();
            assert.equal(status, appConstant.CONTENT_STATUS.PUBLISHED, "'Published' status should be in the top version item");
        });

        it(`GIVEN existing folder(Published) has been modified WHEN Version Panel has been opened THEN 'Modified' status should be in Versions Widget`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let contentSettingsForm = new ContentSettingsForm();
            let contentWizard = new ContentWizard();
            //1. open the folder and select a language:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentSettingsForm.filterOptionsAndSelectLanguage('English (en)');
            await contentWizard.hotKeySaveAndCloseWizard();
            //2. Open version panel and verify status in the latest version-item:
            await contentBrowsePanel.openDetailsPanel();
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.waitForVersionsLoaded();
            let status = await browseVersionsWidget.getContentStatus();
            assert.equal(status, appConstant.CONTENT_STATUS.MODIFIED, "'Modified' status should be in the top version item");
        });

    //Verifies issue https://github.com/enonic/app-contentstudio/issues/1552  'This version is active' button should be shown for any active version
    it(`GIVEN existing folder(Published) is selected WHEN Version Panel has been opened THEN 'This version is active' button should be in the top version only`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            //1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            //2.Open version panel:
            await contentBrowsePanel.openDetailsPanel();
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.waitForVersionsLoaded();
            //3. Click on latest version-item:
            await browseVersionsWidget.clickAndExpandVersion(0);
            await studioUtils.saveScreenshot("verify_active_button_in_versions_1");
            //4. Verify 'Active version' label should be present in the top item:
            await browseVersionsWidget.waitForActiveVersionButtonDisplayed();
            await browseVersionsWidget.clickAndExpandVersion(2);
            await studioUtils.saveScreenshot("verify_active_button_in_versions_2");
            //5. Verify 'Active version' button should not be present in the previous versions:
            await browseVersionsWidget.waitForActiveVersionButtonNotDisplayed();
        });

    it(`GIVEN existing folder(Published) is opened WHEN language has been removed THEN 'Modified' status should be in Versions Widget`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let contentSettingsForm = new ContentSettingsForm();
            let contentWizard = new ContentWizard();
            //1. open the folder and remove the language:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentSettingsForm.clickOnRemoveLanguage();
            await contentWizard.hotKeySaveAndCloseWizard();
            //2. Open version panel and verify status in the latest version-item:
            await contentBrowsePanel.openDetailsPanel();
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.waitForVersionsLoaded();
            let status = await browseVersionsWidget.getContentStatus();
            assert.equal(status, appConstant.CONTENT_STATUS.MODIFIED, "'Modified' status should be in the top version item");
        });

    it("GIVEN existing folder(Modified) is selected WHEN hot key to publish has been pressed AND the content hasbeen published THEN 'Published' status should be in Versions Widget",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            //1. Select the folder and publish it:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.hotKeyPublish();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnMarkAsReadyMenuItem();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentBrowsePanel.pause(500);
            //2. Open version panel and verify status in the top version-item:
            await contentBrowsePanel.openDetailsPanel();
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.waitForVersionsLoaded();
            let status = await browseVersionsWidget.getContentStatus();
            assert.equal(status, appConstant.CONTENT_STATUS.PUBLISHED, "'Published' status should be in the top version item");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
