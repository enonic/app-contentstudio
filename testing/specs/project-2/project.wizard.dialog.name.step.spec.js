/**
 * Created on 05.09.2022 updated on 27.05.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');


describe('project.wizard.dialog.name.step.spec - ui-tests for Name/Id wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PROJECT_NAME = appConst.generateRandomName('proj');

    it(`GIVEN navigated to Name/Id wizard step WHEN identifier input has been cleared THEN 'This field is required' should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let nameIdStep = new ProjectWizardDialogNameAndIdStep();
            // 1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            let parentProjectAndLanguageStep = new ProjectWizardDialogParentProjectStep();
            await parentProjectAndLanguageStep.waitForLoaded();
            // 2. Select 'Default' project and go to 'Name/ID' step
            await parentProjectAndLanguageStep.selectParentProject('Default');
            await parentProjectAndLanguageStep.clickOnNextButton();
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            // 2. Fill in the description input:
            await nameAndIdStep.typeDescription("test");
            await studioUtils.saveScreenshot('proj_wizard_name_id_step_description_filled');
            let actualMessage = await nameIdStep.getProjectIdentifierValidationMessage();
            assert.equal(actualMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED,
                "This field is required - should appear in the input");
            actualMessage = await nameIdStep.getProjectNameValidationMessage();
            assert.equal(actualMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED,
                "This field is required - should appear in the name input");
            // 5. Verify that Next button gets disabled now:
            await nameIdStep.waitForNextButtonDisabled();
        });

    it(`GIVEN navigated to Name/Id wizard step WHEN identifier input has been cleared THEN 'This field is required' should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let nameIdStep = new ProjectWizardDialogNameAndIdStep();
            // 1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            let parentProjectAndLanguageStep = new ProjectWizardDialogParentProjectStep();
            await parentProjectAndLanguageStep.waitForLoaded();
            // 2. Select 'Default' project and go to 'Name/ID' step
            await parentProjectAndLanguageStep.selectParentProject('Default');
            await parentProjectAndLanguageStep.clickOnNextButton();
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            // 2. Fill in the name input:
            await nameAndIdStep.typeDisplayName(PROJECT_NAME);
            // 3. Clear the ID input:
            await nameAndIdStep.clearIdInput();
            await studioUtils.saveScreenshot('proj_wizard_identifier_input_cleared');
            // 4. Verify the validation message
            let actualMessage = await nameIdStep.getProjectIdentifierValidationMessage();
            assert.equal(actualMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED,
                "This field is required - should appear in the input");
            // 5. Verify that Next button gets disabled now:
            await nameIdStep.waitForNextButtonDisabled();
        });

    beforeEach(async () => {
        // selects Default context
        await studioUtils.navigateToContentStudioApp();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});

function containsWhitespace(str) {
    return /\s/.test(str);
}
