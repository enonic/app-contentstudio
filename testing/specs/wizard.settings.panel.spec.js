/**
 * Created on 18.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');
const SettingsStepForm = require('../page_objects/wizardpanel/settings.wizard.step.form');
const PropertiesWidget = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');

describe('wizard.setting.panel.spec:  test for Owner and Language selectors', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);

    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const DISPLAY_NAME = appConst.generateRandomName("folder");

    it(`WHEN folder-wizard is opened THEN 'Save' button should be disabled`,
        async () => {
            let settingsStepForm = new SettingsStepForm();
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //1. Open new folder wizard
            let actualOwner = await settingsStepForm.getSelectedOwner();
            //2. Verify that owner is "Super User" and a language is not selected
            assert.equal(actualOwner, "Super User", "Expected owner should be present");
            //Language filter input should be present
            await settingsStepForm.waitForLanguageOptionsFilterDisplayed()
        });

    it(`WHEN folder-wizard is opened WHEN a language has been selected THEN the same language should be present in the details panel`,
        async () => {
            let contentWizard = new ContentWizard();
            let settingsStepForm = new SettingsStepForm();
            let propertiesWidget = new PropertiesWidget();
            //1. Open new folder wizard
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.openDetailsPanel();
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            //2. Select the language and save the folder:
            await settingsStepForm.filterOptionsAndSelectLanguage('English (en)');
            await contentWizard.waitAndClickOnSave();
            //3.Verify that expected language should be displayed in Details Panel
            let actualLanguage = await propertiesWidget.getLanguage();
            assert.equal(actualLanguage, 'en', "expected language should be present in the widget");
            //4. Remove the selected language and save the folder:
            await settingsStepForm.clickOnRemoveLanguage();
            await contentWizard.waitAndClickOnSave();
            //5. Verify that 'language property' is not displayed in the properties widget now
            await propertiesWidget.waitForLanguageNotVisible();
        });

    it(`WHEN folder-wizard is opened WHEN the default owner has been removed THEN owner property gets not visible in the property widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let settingsStepForm = new SettingsStepForm();
            let propertiesWidget = new PropertiesWidget();
            //1. Open new folder wizard
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //2. Verify the owner property in the widget
            await contentWizard.openDetailsPanel();
            await propertiesWidget.waitForOwnerDisplayed();
            //3. default owner has been removed
            await settingsStepForm.clickOnRemoveOwner();
            await contentWizard.waitAndClickOnSave();
            //4. Verify that 'owner property' is not displayed in the properties widget now
            await propertiesWidget.waitForOwnerNotVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
