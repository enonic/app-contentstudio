/**
 * Created on 26.11.2020.  updated on 10.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogSummaryStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.summary.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');

describe('project.wizard.dialog.select.parent.lower.case.spec - check case sensitive in the first step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PARENT_IN_LOWER_CASE = 'default';

    // Verifies https://github.com/enonic/app-contentstudio/issues/2568
    // Layer wizard - options filter input for parent project is case sensitive
    it("GIVEN no selections in Project Settings panel AND wizard for new layer is opened WHEN 'Default' project has been selected in parent project selector THEN 'Save' button gets enabled", async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        let applicationsStep = new ProjectWizardDialogApplicationsStep();
        let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
        // 1. Open project wizard dialog:
        await settingsBrowsePanel.clickOnNewButton();
        // 2. Type 'default' in the options filter input then click on 'Default' option in the filtered dropdown list
        await parentProjectStep.typeTextInOptionFilterInputAndSelectOption(PARENT_IN_LOWER_CASE, 'Default');
        // 3. Click on Next button:
        await parentProjectStep.clickOnNextButton();
        await nameAndIdStep.typeDisplayName(appConst.generateRandomName('proj'));
        await nameAndIdStep.clickOnNextButton();
        let accessModeStep = new ProjectWizardDialogAccessModeStep();
        await accessModeStep.waitForLoaded();
        // 4. Select 'Private' access mode in the fours step:
        await accessModeStep.clickOnAccessModeRadio('Private');
        await accessModeStep.clickOnNextButton();
        let permissionsStep = new ProjectWizardDialogPermissionsStep();
        await permissionsStep.waitForLoaded();
        // 8. Click on Next button
        await permissionsStep.clickOnNextButton();
        if (await applicationsStep.isLoaded()) {
            await applicationsStep.clickOnNextButton();
        }
        let summaryStep = new ProjectWizardDialogSummaryStep();
        await summaryStep.waitForLoaded();
        let result = await summaryStep.getParentProjectName();
        assert.equal(result, 'Default (default)', 'Parent project name should be displayed in the summary step');
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
