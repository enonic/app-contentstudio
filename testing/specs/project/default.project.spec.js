/**
 * Created on 12.06.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');

describe('default.project.spec - ui-tests for Default project', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let DEFAULT_DESCRIPTION = "Test description";

    it("GIVEN SU is logged in WHEN description has been updated in Default project and Save button pressed THEN expected notification should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. Open 'Default' project:
            await settingsBrowsePanel.clickOnRowByDisplayName("Default");
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.typeDescription(DEFAULT_DESCRIPTION);
            //3. Verify that 'Save' button gets enabled, then click on it
            await projectWizard.waitAndClickOnSave();
            let actualMessage = await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("default_project_updated_1");
            assert.equal(actualMessage, 'Project "default" is modified.', "Expected message should appear");
        });

    it("GIVEN SU is logged in WHEN language has been selected in 'Default' project and 'Save' button pressed THEN expected notification should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. Open 'Default' project:
            await settingsBrowsePanel.clickOnRowByDisplayName("Default");
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.selectLanguage(appConst.LANGUAGES.EN);
            //2. Verify that 'Save' button gets enabled, then click on it
            await projectWizard.waitAndClickOnSave();
            let actualMessage = await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("default_project_updated_2");
            assert.equal(actualMessage, 'Project "default" is modified.', "Expected message should appear");
        });

    it("WHEN Default project has been reopened THEN expected language and description should be displayed",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. Open 'Default' project:
            await settingsBrowsePanel.clickOnRowByDisplayName("Default");
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //3. Verify the language
            let actualLanguage = await projectWizard.getSelectedLanguage();
            assert.equal(actualLanguage, appConst.LANGUAGES.EN, "Expected language should be disaplayed");
            //4. Verify the description:
            let actualDescription = await projectWizard.getDescription();
            assert.equal(actualLanguage, appConst.LANGUAGES.EN, "Expected description should be displayed");
            studioUtils.saveScreenshot("default_project_updated_3");
            assert.equal(actualDescription, DEFAULT_DESCRIPTION, "Expected message should appear");

            //5. Remove the language and clear the description:
            await projectWizard.clickOnRemoveLanguage();
            await projectWizard.typeDescription("");
            //6.Verify that locale options filter input gets visible and enabled:
            await projectWizard.isLocaleOptionsFilterInputClickable();
            actualDescription = await projectWizard.getDescription();
            assert.equal(actualDescription, "", "Description should be cleared now");
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
