/**
 * Created on 02.09.2022 updated on 25.05.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogNameAndIdStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step");

describe('project.wizard.dialog.permissions.step.spec - ui-tests for Permissions wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PARENT_DEFAULT = 'Default';

    it(`GIVEN Default project has been selected as a parent WHEN an user has been selected in Permissions step THEN 'Copy from parent' button gets enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            // 1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select 'Default' project and go to 'Permissions' step
            await parentProjectStep.selectParentProject(PARENT_DEFAULT);
            await parentProjectStep.clickOnNextButton();
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            // 3. Fill in the name input
            await nameAndIdStep.typeDisplayName(appConst.generateRandomName('name'));
            await nameAndIdStep.clickOnNextButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            // 3. Verify that 'Next' button is enabled in Permissions step:
            await permissionsStep.waitForNextButtonEnabled();
            // 4. Verify that 'Copy from parent' button is not displayed:
            await permissionsStep.waitForCopyFromParentButtonNotDisplayed(PARENT_DEFAULT);
            // 5. Select a user in principal-selector:
            await permissionsStep.selectProjectAccessRole(appConst.systemUsersDisplayName.SUPER_USER);
            // 6. Verify that 'Copy from parent' and 'Next' buttons get enabled:
            await permissionsStep.waitForCopyFromParentButtonEnabled(PARENT_DEFAULT);
            await permissionsStep.waitForNextButtonEnabled();
            // 7. Click on 'Copy from parent' button:
            await permissionsStep.clickOnCopyFromParentButton(PARENT_DEFAULT);
            await studioUtils.saveScreenshot('roles_copied_from_default');
            // 8. Verify that 'Copy from parent' gets not visible:
            await accessModeStep.waitForCopyFromParentButtonNotDisplayed(PARENT_DEFAULT);
        });

    it(`GIVEN navigate to Permissions wizard step WHEN newly added principal has been removed THEN 'Copy from parent' button should not be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            // 1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select 'Default' project and go to 'Permissions' step
            await parentProjectStep.selectParentProject(PARENT_DEFAULT);
            await parentProjectStep.clickOnNextButton();

            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            // 3. Fill in the name input
            await nameAndIdStep.typeDisplayName(appConst.generateRandomName('name'));
            await nameAndIdStep.clickOnNextButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            // 5. Select a user in principal-selector:
            await permissionsStep.selectProjectAccessRole(appConst.systemUsersDisplayName.SUPER_USER);
            await permissionsStep.waitForCopyFromParentButtonEnabled(PARENT_DEFAULT);
            let result = await permissionsStep.getSelectedPrincipalOptions();
            assert.equal(result[0], appConst.systemUsersDisplayName.SUPER_USER, "Expected user should be selected in the dropdown");
            // 6. Click on remove and clear roles:
            await permissionsStep.removeProjectAccessItem(appConst.systemUsersDisplayName.SUPER_USER);
            await studioUtils.saveScreenshot('roles_cleared');
            // 7. Verify that 'Copy from parent' gets not visible
            await permissionsStep.waitForCopyFromParentButtonNotDisplayed(PARENT_DEFAULT);
        });

    it(`GIVEN Permissions step is loaded and SU has been added  WHEN navigate to the previous wizard step then go back to permissions step again THEN expected permissions entry should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            // 1.Open new project wizard and go to Access Mode step:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select 'Default' project and go to 'Permissions' step
            await parentProjectStep.selectParentProject(PARENT_DEFAULT);
            await parentProjectStep.clickOnNextButton();
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            // 3. Fill in the name input
            await nameAndIdStep.typeDisplayName(appConst.generateRandomName('name'));
            await nameAndIdStep.clickOnNextButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.waitForLoaded();
            // 5. Select a user in principal-selector:
            await permissionsStep.selectProjectAccessRole(appConst.systemUsersDisplayName.SUPER_USER);
            await permissionsStep.waitForCopyFromParentButtonEnabled(PARENT_DEFAULT);
            let result = await permissionsStep.getSelectedPrincipalOptions();
            // 3. Click on Previous button:
            await permissionsStep.clickOnPreviousButton();
            await accessModeStep.waitForLoaded();
            // 4. Go back to the permissions step:
            await accessModeStep.clickOnNextButton();
            await permissionsStep.waitForLoaded();
            // 5. Verify the selected option is present in the step:
            let actualResult = await permissionsStep.getSelectedPrincipalOptions();
            assert.equal(actualResult[0], appConst.systemUsersDisplayName.SUPER_USER,
                "Expected user should be present in the permissions step");
            await permissionsStep.waitForNextButtonEnabled();
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
