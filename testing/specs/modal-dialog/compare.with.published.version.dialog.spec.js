/**
 * Created on 28.12.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const CompareWithPublishedVersionDialog = require('../../page_objects/compare.with.published.version.dialog');

describe.skip("compare.with.published.version.dialog.spec tests for 'Show changes' modal dialog", function () {
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

    // TODO epic-enonic-ui new tests:
    it.skip(`GIVEN language has been selected in the wizard WHEN Compare With Published Version Dialog has been opened THEN 'modifiedTime', 'workflow' and 'language' properties should be visible in the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareWithPublishedVersionDialog = new CompareWithPublishedVersionDialog();
            // 1. Open the folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            // 2. Open Edit Setting modal dialog and select the language:
            let editDetailsDialog = await studioUtils.openEditSettingDialog();
            await editDetailsDialog.waitForLoaded();
            await editDetailsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editDetailsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            // preview toolbar should be shown by default:
            // 3. Open 'Compare With Published Version' modal dialog
            await contentWizard.clickOnVersionHistoryButton();
            ///TODO

            await compareWithPublishedVersionDialog.waitForDialogOpened();
            // 4. Verify that language property is displayed now :
            await compareWithPublishedVersionDialog.waitForAddedPropertyDisplayed(appConst.COMPARE_VERSIONS_DLG_PROP.LANGUAGE);
            // 5. Expected language should be displayed
            let value = await compareWithPublishedVersionDialog.getValueInAddedProperty(appConst.COMPARE_VERSIONS_DLG_PROP.LANGUAGE);
            assert.ok(value.includes('en'), 'language:"en"  should be displayed in the dialog');
            // 6. workflow property should be displayed in the modal dialog:
            await compareWithPublishedVersionDialog.waitForModifiedWorkflowDisplayed();
            // 7. Verify  the modifiedTime property
            await compareWithPublishedVersionDialog.waitForModifiedPropertyDisplayed(appConst.COMPARE_VERSIONS_DLG_PROP.MODIFIED_TIME);
        });

    // TODO epic-enonic-ui new tests:
    it(`GIVEN language has been removed in the wizard WHEN Compare With Published Version Dialog has been opened THEN 'language' property should not be present in the modal dialog`,
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
            // preview toolbar should be shown by default:
            // 3. Open 'Compare With Published Version' modal dialog
            // TODO
            await contentWizard.clickOnVersionHistoryButton();
            await compareWithPublishedVersionDialog.waitForDialogOpened();
            // 4. Verify that language property is not displayed now :
            await compareWithPublishedVersionDialog.waitForAddedPropertyNotDisplayed(appConst.COMPARE_VERSIONS_DLG_PROP.LANGUAGE);
            // 5. 'workflow' property should be displayed in the modal dialog:
            await compareWithPublishedVersionDialog.waitForModifiedWorkflowDisplayed();
            // 6. Verify  the 'modifiedTime' property
            await compareWithPublishedVersionDialog.waitForModifiedPropertyDisplayed(appConst.COMPARE_VERSIONS_DLG_PROP.MODIFIED_TIME);
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
