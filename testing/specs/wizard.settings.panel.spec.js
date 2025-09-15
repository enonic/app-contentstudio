/**
 * Created on 18.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');
const PropertiesWidget = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');

describe('wizard.setting.panel.spec:  test for Owner and Language selectors', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const FOLDER_DISPLAY_NAME = appConst.generateRandomName('folder');

    it(`WHEN folder-wizard is opened THEN the owner should be "Super User" and a language should not be selected`,
        async () => {
            // 1. Open new wizard for folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Open 'Edit Settings' modal dialog:
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            let actualOwner = await editSettingsDialog.getSelectedOwner();
            // 3. Verify that owner is "Super User" and a language is not selected
            assert.equal(actualOwner, appConst.systemUsersDisplayName.SUPER_USER, 'Expected owner should be present');
            // 4. Language filter input should be displayed:
            await editSettingsDialog.waitForLanguageOptionsFilterDisplayed();
        });

    it(`WHEN folder-wizard is opened WHEN a language has been selected THEN the same language should be present in the Wizard Details Panel`,
        async () => {
            let contentWizard = new ContentWizard();
            let propertiesWidget = new PropertiesWidget();
            // 1. Open new folder wizard
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.openContextWindow();
            await contentWizard.typeDisplayName(FOLDER_DISPLAY_NAME);
            // 2. Open 'Edit Settings' modal dialog and select the language:
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            // 3. Select the language then click on Apply button and close the dialog:
            await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(300);
            // 4. Click on 'Save' button:
            await contentWizard.waitAndClickOnSave();
            // 3. Verify that expected language should be displayed in Details Panel
            let actualLanguage = await propertiesWidget.getLanguage();
            assert.equal(actualLanguage, 'en', 'expected language should be present in the widget');
        });

    // Verify the bug - https://github.com/enonic/lib-admin-ui/issues/3950
    // Language field keeps previous search #3950
    it(`WHEN a language has been updated THEN the updated language should be displayed in browse details panel`,
        async () => {
            let contentWizard = new ContentWizard();
            let propertiesWidget = new PropertiesWidget();
            // 1. Select the existing folder with En language
            await studioUtils.findAndSelectItem(FOLDER_DISPLAY_NAME);
            // 2. Open 'Edit Settings' modal dialog in Browse Panel:
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            // 3. Remove then Select de-language, click on Apply button and close the dialog:
            await editSettingsDialog.clickOnRemoveLanguage();
            await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.DEUTSCH_DE);
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('language_updated_poperties_widget');
            // 3. Verify that expected language should be displayed in Browse Details Panel
            let actualLanguage = await propertiesWidget.getLanguage();
            assert.equal(actualLanguage, 'de', 'expected language should be present in the widget');
        });

    it(`WHEN existing folder is opened WHEN the selected language has been removed THEN the language should not be displayed in the properties widget`,
        async () => {
            let propertiesWidget = new PropertiesWidget();
            // 1. existing folder is opened:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_DISPLAY_NAME);
            // 2. Open 'Edit Settings' modal dialog and select the language:
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            // 3. Remove the selected language:
            await editSettingsDialog.clickOnRemoveLanguage();
            await editSettingsDialog.clickOnApplyButton();
            // 4. Verify that 'language property' is not displayed in the properties widget now:
            await propertiesWidget.waitForLanguageNotVisible();
        });

    it(`WHEN folder-wizard is opened WHEN the default owner has been removed THEN owner property gets not visible in the property widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let propertiesWidget = new PropertiesWidget();
            // 1. Open wizard for new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Verify the owner property in the widget
            await contentWizard.openContextWindow();
            await propertiesWidget.waitForOwnerDisplayed();
            // 3. default owner has been removed
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await editSettingsDialog.clickOnRemoveOwner();
            // 4. Click on Apply button:
            await editSettingsDialog.clickOnApplyButton();
            // 5. Verify that 'owner property' is not displayed in the properties-widget now
            await propertiesWidget.waitForOwnerNotVisible();
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
