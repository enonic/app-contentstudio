/**
 * Created on 15.02.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('Revert published content spec', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;

    it(`WHEN new folder has been published THEN Published status should be displayed`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentWizard = new ContentWizard();
            let settingsForm = new SettingsStepForm();
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            //1. Add new folder:
            await studioUtils.doAddFolder(FOLDER);
            //2. reopen the folder and select a language
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await settingsForm.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            //"Published status should be in Wizard"
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.PUBLISHED);
        });

    it(`GIVEN published folder is selected WHEN the previous version has been reverted THEN 'Modified' status should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            //1. Open the folder and revert the previous version:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openVersionsHistoryPanel();
            //2. Revert the previous version:
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRevertButton();
            //3. Verify the message:
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.include(actualMessage, appConst.CONTENT_REVERTED_MESSAGE, "Expected notification message should appear");
            //4. Verify that status gets Modified
            let status = await contentWizard.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.MODIFIED, "Modified status should be in Wizard");
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
