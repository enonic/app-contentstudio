/**
 * Created on 28.12.2022  updated on 02.07.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const CompareWithPublishedVersionDialog = require('../../page_objects/compare.with.published.version.dialog');
const WizardVersionsWidget = require("../../page_objects/wizardpanel/details/wizard.versions.widget");

describe("compare.with.published.version.dialog.spec tests for 'Show changes' modal dialog", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let FOLDER_NAME = appConst.generateRandomName('folder');

    it('Preconditions- published folder should be added',
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open new wizard for folder
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Fill in the name input
            await contentWizard.typeDisplayName(FOLDER_NAME);
            // 3. Publish this folder:
            await contentWizard.clickOnMarkAsReadyButton();
            await studioUtils.doPublish();
        });

    it(`GIVEN language has been selected for the published folder WHEN 'Edited' and 'Renamed' versions have been compared in the Versions widget THEN added 'language' property with 'en' value should be displayed in the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareWithPublishedVersionDialog = new CompareWithPublishedVersionDialog();
            // 1. Open the folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            // 2. Open Edit Setting modal dialog and select the language:
            let editDetailsDialog = await studioUtils.openEditSettingDialog();
            await editDetailsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editDetailsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            // 3. Click on 'New/Modified/Published' button
            await contentWizard.clickOnVersionHistoryButton();
            let wizardVersionsWidget = new WizardVersionsWidget();
            await wizardVersionsWidget.waitForLoaded();
            // 4. Select  the newly Edited item and the previous item
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader('Edited', 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader('Renamed',0);
            // 5. Click on 'Show changes' button
            await wizardVersionsWidget.clickOnShowChangesButton();
            // 6. CompareVersionsDialog dialog  should be loaded
            await compareWithPublishedVersionDialog.waitForDialogOpened();
            // 7. Verify the 'Online' status in the Older column
            await compareWithPublishedVersionDialog.waitForOnlineStatusInOlderVersionCard();
            // 8. Verify that language property is displayed in the modal dialog :
            await compareWithPublishedVersionDialog.waitForAddedPropertyDisplayed(appConst.COMPARE_VERSIONS_DLG_PROP.LANGUAGE);
            // 9. Expected language should be displayed
            let value = await compareWithPublishedVersionDialog.getAddedPropertyValue(appConst.COMPARE_VERSIONS_DLG_PROP.LANGUAGE);
            assert.ok(value.includes('en'), 'language:"en"  should be displayed in the dialog');
            // workflow property should be displayed in the modal dialog:
            //await compareWithPublishedVersionDialog.waitForModifiedPropertyDisplayed(appConst.COMPARE_VERSIONS_DLG_PROP.WORKFLOW);
            // Verify  the modifiedTime property
            //await compareWithPublishedVersionDialog.waitForModifiedPropertyDisplayed(appConst.COMPARE_VERSIONS_DLG_PROP.MODIFIED_TIME);
        });

    it(`GIVEN language has been removed in the content WHEN newly crated item has been compared with Renamed item THEN 'language' property should not be displayed in the modal dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareWithPublishedVersionDialog = new CompareWithPublishedVersionDialog();
            // 1. Select the folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            // 2. remove the language:
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await editSettingsDialog.clickOnRemoveLanguage();
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            // 3. Open 'Compare With Published Version' modal dialog
            await contentWizard.clickOnVersionHistoryButton();
            let wizardVersionsWidget = new WizardVersionsWidget();
            await wizardVersionsWidget.waitForLoaded();
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader('Edited', 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader('Renamed',0);
            await wizardVersionsWidget.clickOnShowChangesButton();
            await compareWithPublishedVersionDialog.waitForDialogOpened();
            let message =  await compareWithPublishedVersionDialog.waitForVersionsIdenticalMessage();
            assert.equal(message, 'Versions are identical', "Expected message should be displayed in the dialog");
            // 4. Verify that language property is not displayed now :
            await compareWithPublishedVersionDialog.waitForAddedPropertyNotDisplayed(appConst.COMPARE_VERSIONS_DLG_PROP.LANGUAGE);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
