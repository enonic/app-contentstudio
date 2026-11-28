/**
 * Created on 18.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');
const DetailsWidgetInfoSection = require('../page_objects/browsepanel/detailspanel/details.widget.info.section');

describe(`wizard.settings.panel.spec: tests for Owner and Language selectors in 'Edit Settings' dialog`, function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const FOLDER_DISPLAY_NAME = appConst.generateRandomName('folder');

    it(`GIVEN wizard for new folder is opened WHEN 'Edit Settings' dialog has been opened THEN 'Super User' should be the selected owner AND a language should not be selected`, async () => {
        // 1. Open new wizard for folder:
        let contentWizard = new ContentWizard();
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizard.openContextWindow();
        await contentWizard.pause(1000);
        // 2. Open 'Edit Settings' modal dialog:
        let editSettingsDialog = await studioUtils.openEditSettingDialog();
        let actualOwner = await editSettingsDialog.getSelectedOwner();
        // 3. Verify that owner is 'Super User':
        assert.equal(actualOwner, appConst.systemUsersDisplayName.SUPER_USER, 'Expected owner should be present');
        // 4. Language filter input should be displayed, because a language is not selected:
        await editSettingsDialog.waitForLanguageOptionsFilterDisplayed();
        await editSettingsDialog.clickOnCloseButton();
        await editSettingsDialog.waitForClosed();
    });

    it(`GIVEN new folder has been saved in the wizard WHEN a language has been selected in 'Edit Settings' dialog THEN the language should be displayed in the details widget of the wizard`, async () => {
        let contentWizard = new ContentWizard();
        let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
        // 1. Open new folder wizard, type the name and save the folder:
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizard.openContextWindow();
        await contentWizard.typeDisplayName(FOLDER_DISPLAY_NAME);
        await contentWizard.waitAndClickOnSave();
        await contentWizard.waitForNotificationMessage();
        // 2. Open 'Edit Settings' modal dialog:
        let editSettingsDialog = await studioUtils.openEditSettingDialog();
        // 3. Select the language then click on Apply button and close the dialog:
        await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
        await editSettingsDialog.clickOnApplyButton();
        await contentWizard.waitForNotificationMessage();
        await contentWizard.pause(300);
        // 4. Verify that expected language should be displayed in Details Panel
        let actualLanguage = await detailsWidgetInfoSection.getLanguage();
        assert.equal(actualLanguage, 'en', 'expected language should be present in the widget');
    });

    // Verify the bug - https://github.com/enonic/lib-admin-ui/issues/3950
    // Language field keeps previous search #3950
    it(`GIVEN existing folder with 'en' language is selected in the grid WHEN the language has been replaced with 'de' in 'Edit Settings' dialog THEN the updated language should be displayed in browse details panel`, async () => {
        let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
        // 1. Select the existing folder with En language
        await studioUtils.findAndSelectItem(FOLDER_DISPLAY_NAME);
        // 2. Open 'Edit Settings' modal dialog in Browse Panel:
        let editSettingsDialog = await studioUtils.openEditSettingDialog();
        // 3. Remove then Select de-language, click on Apply button and close the dialog:
        await editSettingsDialog.clickOnRemoveLanguage();
        await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.DEUTSCH_DE);
        await editSettingsDialog.clickOnApplyButton();
        await editSettingsDialog.waitForNotificationMessage();
        await editSettingsDialog.waitForClosed();
        await editSettingsDialog.removeNotificationMessage();
        await studioUtils.saveScreenshot('language_updated_properties_widget');
        // 4. Verify that expected language should be displayed in Browse Details Panel
        let actualLanguage = await detailsWidgetInfoSection.getLanguage();
        assert.equal(actualLanguage, 'de', 'expected language should be present in the widget');
    });

    it(`GIVEN existing folder with selected language is opened WHEN the language has been removed in 'Edit Settings' dialog THEN the language should not be displayed in the details widget`, async () => {
        let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
        let contentWizard = new ContentWizard();
        // 1. existing folder is opened:
        await studioUtils.selectAndOpenContentInWizard(FOLDER_DISPLAY_NAME);
        // 2. Open 'Edit Settings' modal dialog:
        await contentWizard.openContextWindow();
        let editSettingsDialog = await studioUtils.openEditSettingDialog();
        // 3. Remove the selected language:
        await editSettingsDialog.clickOnRemoveLanguage();
        await editSettingsDialog.clickOnApplyButton();
        // 4. Verify that 'language property' is not displayed in the properties widget now:
        await detailsWidgetInfoSection.waitForLanguageNotVisible();
    });

    it(`GIVEN wizard for new folder is opened WHEN the default owner has been removed in 'Edit Settings' dialog THEN the owner should not be displayed in the details widget`, async () => {
        let contentWizard = new ContentWizard();
        let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
        // 1. Open wizard for new folder:
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        // 2. Verify the owner property in the widget
        await contentWizard.openContextWindow();
        await detailsWidgetInfoSection.waitForOwnerDisplayed();
        // 3. default owner has been removed
        let editSettingsDialog = await studioUtils.openEditSettingDialog();
        await editSettingsDialog.clickOnRemoveOwner();
        // 4. Click on Apply button:
        await editSettingsDialog.clickOnApplyButton();
        // 5. Verify that 'owner property' is not displayed in the properties-widget now
        await detailsWidgetInfoSection.waitForOwnerNotVisible();
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
