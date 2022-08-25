/**
 * Created on 02.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');

describe('project.wizard.validation.spec - validation specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");

    it.skip(`GIVEN new project wizard is opened WHEN just display name have been typed THEN 'Save' should be disabled(Access mode is not selected)`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Open new wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            //2. Verify that 'Save' button is disabled(Access mode is not selected):
            await projectWizard.waitForSaveButtonDisabled();
            studioUtils.saveScreenshot("project_validation_0");
        });

    it.skip(`GIVEN display name and 'Public' in access mode are filled WHEN the identifier contains a white space THEN 'Save' should be disabled and error message gets visible`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Open new wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Public");
            //2. Type a identifier with white space:
            await projectWizard.typeInProjectIdentifier("my project");
            //3. Verify that 'Save' button gets disabled:
            await projectWizard.waitForSaveButtonDisabled();
            studioUtils.saveScreenshot("project_validation_1");
            let errorMessage = await projectWizard.getProjectIdentifierValidationMessage();
            assert.equal(errorMessage, "Invalid value entered", "Expected validation message gets visible");
        });

    it.skip(`GIVEN identifier contains a white space WHEN the identifier has been corrected THEN 'Save' gets enabled AND error message gets not visible`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'Open new wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Custom");
            //2. Type a identifier with white space:
            await projectWizard.typeInProjectIdentifier("my project");
            //3. Verify that 'Save' button gets disabled:
            await projectWizard.waitForSaveButtonDisabled();
            //4. The identifier has been corrected:
            await projectWizard.typeInProjectIdentifier("my_project");
            studioUtils.saveScreenshot("project_validation_1");
            //5. Verify that validation message gets not visible and Save gets enabled:
            await projectWizard.waitForProjectIdentifierValidationMessageNotVisible();
            await projectWizard.waitForSaveButtonEnabled();
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
