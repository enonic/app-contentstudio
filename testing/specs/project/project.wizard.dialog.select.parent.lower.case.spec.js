/**
 * Created on 26.11.2020.
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');

describe('project.wizard.dialog.select.parent.lower.case.spec - check case sensitive in the first step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PARENT_IN_LOWER_CASE = 'default';
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');

    //Verifies https://github.com/enonic/app-contentstudio/issues/2568
    //Layer wizard - options filter input for parent project is case sensitive
    it("GIVEN no selections in Project Settings panel AND wizard for new layer is opened WHEN 'Default' project has been selected in parent project selector THEN 'Save' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            //1. Open project wizard dialog and click on Layer radio:
            await settingsBrowsePanel.openProjectWizardDialog();
            await parentProjectStep.clickOnLayerRadioButton();
            //2. Type 'default' in the options filter input then click on 'Default' option in the filtered dropdown list
            await parentProjectStep.typeTextInOptionFilterInputAndSelectOption(PARENT_IN_LOWER_CASE, "Default");
            //3. Click on Next button:
            await parentProjectStep.clickOnNextButton();
            //4. Skip the language step
            await languageStep.waitForLoaded();
            await languageStep.clickOnSkipButton();

            //5. Select 'Private' access mode in the fours step:
            let permissionsStep = await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await permissionsStep.waitForLoaded();
            //6. skip the permissions step:
            await permissionsStep.clickOnSkipButton();
            //7. Skip the applications step
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            //8. Fill in the name input
            let summaryStep = await projectUtils.fillNameAndDescriptionStep(LAYER_DISPLAY_NAME);
            await summaryStep.waitForLoaded();
            //9. Click on 'Create Project' button and wait for the dialog is closed:
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it("Post conditions: the layer should be deleted",
        async () => {
            //1.Select and delete the layer:
            await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
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
