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

describe('project.wizard.dialog.access.mode.step.spec - ui-tests for Access mode wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PARENT_DEFAULT = 'Default';

    it(`GIVEN 'Default' project is selected as a parent project WHEN navigate to Access mode wizard step AND click on 'Copy from parent' THEN 'Copy from parent' button gets disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            // 1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select Default project and go to 'Access mode' step
            await parentProjectStep.selectParentProject(PARENT_DEFAULT);
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            // 3. Verify that 'Next' button is disabled in Access mode step:
            await accessModeStep.waitForNextButtonDisabled();
            // 4. Click on 'Copy from parent' button:
            await accessModeStep.clickOnCopyFromParentButton(PARENT_DEFAULT);
            let actualMessage = await accessModeStep.waitForNotificationMessage();
            assert.equal(actualMessage, appConst.projectAccessModeCopied('Default'));
            await studioUtils.saveScreenshot('access_mode_copied_from_default');
            // 5. Verify that 'Next' button gets enabled now:
            await accessModeStep.waitForNextButtonEnabled();
            // 6. Verify that 'Copy from parent' button gets disabled now:
            await accessModeStep.waitForCopyFromParentButtonDisabled(PARENT_DEFAULT);
        });

    it(`GIVEN navigate to Access mode wizard step WHEN 'Private'(the same value as in parent project ) mode has been selected THEN 'Copy from parent' button gets disabled enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            // 1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select Default project and go to Access mode step
            await parentProjectStep.selectParentProject(PARENT_DEFAULT);
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            // 3. Verify that 'Next' button is disabled in Access mode step:
            await accessModeStep.waitForNextButtonDisabled();
            // 4. Click on 'Public' radio button:
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            // 5. Verify that Next button gets enabled:
            await accessModeStep.waitForNextButtonEnabled();
            // 6. Verify that 'Copy from parent' button is enabled:
            await accessModeStep.waitForCopyFromParentButtonEnabled(PARENT_DEFAULT);
            // 7. Click on 'Private' radio button
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await studioUtils.saveScreenshot('access_mode_the_same_in_default');
            // 8. Verify that 'Next' button gets enabled:
            await accessModeStep.waitForNextButtonEnabled();
            // 9. Verify that 'Copy from parent' button gets disabled again:
            await accessModeStep.waitForCopyFromParentButtonDisabled(PARENT_DEFAULT);
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
