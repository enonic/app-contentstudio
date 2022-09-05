/**
 * Created on 05.09.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');
const ProjectWizardDialogSummaryStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.summary.step');

describe('project.wizard.dialog.name.step.spec - ui-tests for Name/Id wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const NAME = appConst.generateRandomName("project");
    const ID = appConst.generateRandomName("id");
    const ID_WITH_WHITE_SPACE = "test" + " " + appConst.generateRandomName("id");
    const TEST_DESCRIPTION = "Test description";

    it.skip(
        `GIVEN navigated to Name/Id wizard step WHEN identifier with white spaces has been typed THEN spaces should be trimmed AND 'Next' button should be enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let nameIdStep = new ProjectWizardDialogNameAndIdStep();
            //1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            //2. Select 'Default' project and go to 'Name/ID' step
            await parentProjectStep.selectParentProject("Default");
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            await applicationsStep.waitForSkipButtonEnabled();
            await applicationsStep.clickOnSkipButton();
            //2. Fill in the name input:
            await nameIdStep.typeDisplayName(NAME);
            //3. Insert an id with whitespace:
            await nameIdStep.typeTextInProjectIdentifierInput(ID_WITH_WHITE_SPACE);
            await studioUtils.saveScreenshot("proj_wizard_identifier_spaces");
            //4. Verify that white spaces are trimmed
            let actualId = await nameIdStep.getProjectIdentifier();
            let whitespace = containsWhitespace(actualId);
            assert.isFalse(whitespace, "White spaces should be trimmed in the input");
        });

    it.skip(
        `GIVEN navigated to Name/Id wizard step WHEN identifier input has been cleared THEN 'This field is required' should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let nameIdStep = new ProjectWizardDialogNameAndIdStep();
            //1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            //2. Go to 'Name/ID' step:
            await parentProjectStep.clickOnSkipButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            await applicationsStep.waitForSkipButtonEnabled();
            await applicationsStep.clickOnSkipButton();
            //3. Fill in the name input:
            await nameIdStep.typeDisplayName(NAME);
            //4. Fill in the identifier input:
            await nameIdStep.typeTextInProjectIdentifierInput("");
            let actualMessage = await nameIdStep.getProjectIdentifierValidationMessage();
            assert.equal(actualMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED,
                "This field is required - should appear in the input");
            //5. Verify that Next button gets disabled now:
            await nameIdStep.waitForNextButtonDisabled();
        });

    it(`GIVEN new project has been created WHEN Parent project step has been opened THEN new created project should be searchable by Identifier`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let nameIdStep = new ProjectWizardDialogNameAndIdStep();
            let summaryStep = new ProjectWizardDialogSummaryStep();
            //1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            //2. Go to 'Name/ID' step:
            await parentProjectStep.clickOnSkipButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            await applicationsStep.waitForSkipButtonEnabled();
            await applicationsStep.clickOnSkipButton();
            //3. Fill in the name input:
            await nameIdStep.typeDisplayName(NAME);
            //4. Fill in the identifier input:
            await nameIdStep.typeTextInProjectIdentifierInput(ID);
            //5. Fill in the Description input:
            await nameIdStep.typeDescription(TEST_DESCRIPTION);
            await nameIdStep.clickOnNextButton();
            await summaryStep.waitForLoaded();
            //6. Save the project
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            //7. Open project wizard dialog again
            await settingsBrowsePanel.openProjectWizardDialog();
            //8. Verify that projects searchable by Identifier:
            await parentProjectStep.typeTextInOptionFilterInputAndSelectOption(ID, NAME);
            let actualName = await parentProjectStep.getSelectedProject();
            assert.equal(actualName, NAME, "Expected parent project should be present in the selected option");
        });

    it(`WHEN Parent project step has been opened THEN new created project should be searchable by Description`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            //1. Open project wizard dialog:
            await settingsBrowsePanel.openProjectWizardDialog();
            //2. Verify that projects searchable by Description:
            await parentProjectStep.typeTextInOptionFilterInputAndSelectOption(TEST_DESCRIPTION, NAME);
            let actualName = await parentProjectStep.getSelectedProject();
            assert.equal(actualName, NAME, "Expected parent project should be present in the selected option");
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

function containsWhitespace(str) {
    return /\s/.test(str);
}
