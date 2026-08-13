/**
 * Created on 02.09.2022  updated on 12.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');

describe('project.wizard.dialog.access.mode.step.spec - ui-tests for Access mode wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PARENT_DEFAULT = 'Default';

    it(`GIVEN navigate to Access mode wizard step WHEN click on 'Copy from parent' THEN expected radio button becomes selected`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        let accessModeStep = new ProjectWizardDialogAccessModeStep();
        // 1. Open the project wizard:
        await settingsBrowsePanel.openProjectWizardDialog();
        let parentProjectAndLanguageStep = new ProjectWizardDialogParentProjectStep();
        await parentProjectAndLanguageStep.waitForLoaded();
        // 2. Select 'Default' project and go to 'Name/ID' step
        await parentProjectStep.selectParentProject(PARENT_DEFAULT);
        await parentProjectStep.clickOnNextButton();
        let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
        await nameAndIdStep.waitForLoaded();
        await nameAndIdStep.typeDisplayName(studioUtils.generateRandomName('layer'));
        await nameAndIdStep.clickOnNextButton();
        await accessModeStep.waitForLoaded();
        // 3. Verify that 'Next' button is disabled in Access mode step:
        await accessModeStep.waitForNextButtonDisabled();
        // 4. Click on 'Copy from parent' button:
        await accessModeStep.clickOnCopyFromParentButton(PARENT_DEFAULT);
        await studioUtils.saveScreenshot('access_mode_copied_from_default');
        // 5. Verify that 'Next' button becomes enabled now:
        await accessModeStep.waitForNextButtonEnabled();
        // 6. Verify that 'Copy from parent' button gets disabled now:
        let accessMode = await accessModeStep.getSelectedAccessMode();
        assert.equal(accessMode, appConst.PROJECT_ACCESS_MODE.PUBLIC, 'Public access mode should be selected');
    });

    it(`GIVEN 'Private' mode has been selected WHEN 'Copy from parent' button has been clicked THEN 'Public' radio becomes selected`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        let accessModeStep = new ProjectWizardDialogAccessModeStep();
        // 1. Open the project wizard:
        await settingsBrowsePanel.openProjectWizardDialog();
        let parentProjectAndLanguageStep = new ProjectWizardDialogParentProjectStep();
        await parentProjectAndLanguageStep.waitForLoaded();
        // 2. Select 'Default' project and go to 'Name/ID' step
        await parentProjectStep.selectParentProject(PARENT_DEFAULT);
        await parentProjectStep.clickOnNextButton();
        let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
        await nameAndIdStep.waitForLoaded();
        await nameAndIdStep.typeDisplayName(studioUtils.generateRandomName('layer'));
        await nameAndIdStep.clickOnNextButton();
        await accessModeStep.waitForLoaded();
        // 3. Verify that 'Next' button is disabled in Access mode step:
        await accessModeStep.waitForNextButtonDisabled();
        // 4. Click on Private radio
        await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PRIVATE);
        // 4. Click on 'Copy from parent' button:
        await accessModeStep.clickOnCopyFromParentButton(PARENT_DEFAULT);
        await studioUtils.saveScreenshot('access_mode_copied_from_default');
        // 5. Verify that 'Next' button becomes enabled now:
        await accessModeStep.waitForNextButtonEnabled();
        // Verify the access mode:
        let accessMode = await accessModeStep.getSelectedAccessMode();
        assert.equal(accessMode, appConst.PROJECT_ACCESS_MODE.PUBLIC, 'Public access mode should be selected');
        // 6. Verify that 'Copy from parent' button gets not visible:
        await accessModeStep.waitForCopyFromParentButtonNotDisplayed(PARENT_DEFAULT);
    });

    beforeEach(async () => {
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
