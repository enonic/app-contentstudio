/**
 * Created on 02.09.2022
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
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            // 3. Verify that 'Skip' button is enabled in Permissions step:
            await permissionsStep.waitForSkipButtonEnabled();
            // 4. Verify that 'Copy from parent' button is disabled:
            await permissionsStep.waitForCopyFromParentButtonDisabled(PARENT_DEFAULT);
            // 5. Select a user in principal-selector:
            await permissionsStep.selectProjectAccessRole(appConst.systemUsersDisplayName.SUPER_USER);
            // 6. Verify that 'Copy from parent' and 'Next' buttons get enabled:
            await permissionsStep.waitForCopyFromParentButtonEnabled(PARENT_DEFAULT);
            await permissionsStep.waitForNextButtonEnabled();
            // 7. Click on 'Copy from parent' button:
            await accessModeStep.clickOnCopyFromParentButton(PARENT_DEFAULT);
            let actualMessage = await accessModeStep.waitForNotificationMessage();
            // Verify the message - 'Roles has been copied from "Default"'
            assert.equal(actualMessage, appConst.projectRolesCopied(PARENT_DEFAULT));
            await studioUtils.saveScreenshot('roles_copied_from_default');
            // 8. Verify that 'Skip' button gets visible and enabled:
            await accessModeStep.waitForSkipButtonEnabled();
            // 9. Verify that 'Copy from parent' button gets disabled now:
            await accessModeStep.waitForCopyFromParentButtonDisabled(PARENT_DEFAULT);
        });

    it(`GIVEN Default project is selected as a parent project WHEN navigate to Permissions wizard step THEN 'Copy from parent' button should be disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            // 1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select 'Default' project and go to 'Permissions' step
            await parentProjectStep.selectParentProject(PARENT_DEFAULT);
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            // 3. Verify that 'Skip' button is enabled in Permissions step:
            await permissionsStep.waitForSkipButtonEnabled();
            // 4. Verify that 'Copy from parent' button is disabled:
            await permissionsStep.waitForCopyFromParentButtonDisabled(PARENT_DEFAULT);
            // 5. Select a user in principal-selector:
            await permissionsStep.selectProjectAccessRole(appConst.systemUsersDisplayName.SUPER_USER);
            // 6. Click on remove and clear roles:
            await permissionsStep.removeProjectAccessItem(appConst.systemUsersDisplayName.SUPER_USER);
            await studioUtils.saveScreenshot('roles_cleared');
            // 7. Verify that 'Copy from parent' gets disabled
            await permissionsStep.waitForCopyFromParentButtonDisabled(PARENT_DEFAULT);
            // 8. and 'Skip' buttons gets visible again and enabled:
            await permissionsStep.waitForSkipButtonEnabled();
        });

    it(`GIVEN Permissions step is loaded and SU has been added  WHEN navigate to the previous wizard step then go back to permissions step again THEN expected permissions entry should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            // 1.Open new project wizard and go to Access Mode step:
            await settingsBrowsePanel.openProjectWizardDialog();
            // click on Skip button:
            await parentProjectStep.clickOnSkipButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            // 2. Select a user in principal-selector:
            await permissionsStep.selectProjectAccessRole(appConst.systemUsersDisplayName.SUPER_USER);
            // 3. Click on Previous button:
            await permissionsStep.clickOnBackButton();
            await accessModeStep.waitForLoaded();
            // 4. Go back to the permissions step:
            await accessModeStep.clickOnNextButton();
            // 5. Verify the selected option is present in the step:
            let actualResult = await permissionsStep.getSelectedPrincipals();
            assert.equal(actualResult[0], appConst.systemUsersDisplayName.SUPER_USER,
                "Expected user should be present in the permissions step");
            await permissionsStep.waitForNextButtonEnabled();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
