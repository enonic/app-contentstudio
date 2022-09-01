/**
 * Created on 31.08.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');

describe('project.wizard.dialog.language.step.spec - ui-tests for Language wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN Default project is selected AND wizard dialog is opened WHEN a language has been selected in the wizard step THEN 'Copy from parent' button gets enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            //1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            //2. Select Default project:
            await parentProjectStep.selectParentProject("Default");
            await parentProjectStep.clickOnNextButton();
            //3. Verify that 'Copy from parent' button is disabled:
            await languageStep.waitForCopyFromParentButtonDisabled();
            //4. Select the language:
            await languageStep.selectLanguage(appConst.LANGUAGES.EN);
            //5. Verify that 'Next' button gets visible now:
            await languageStep.waitForNextButtonDisplayed();
            //6. Verify that 'Copy from parent' gets enabled, Click on the button:
            await languageStep.clickOnCopyFromParentButton();
            let message = await languageStep.waitForNotificationMessage();
            assert.equal(message, appConst.languageCopiedNotification("Default"), "Expected notification message");
            //7. Verify that 'Skip' button gets visible again
            await languageStep.waitForSkipButtonDisplayed();
        });

    it(`GIVEN a language has been selected in the wizard step WHEN selected language option has been removed THEN 'Copy from parent' button gets enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            //1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            //2. Select Default project:
            await parentProjectStep.selectParentProject("Default");
            await parentProjectStep.clickOnNextButton();
            //3. Select a language:
            await languageStep.selectLanguage(appConst.LANGUAGES.EN);
            await languageStep.waitForNextButtonDisplayed();
            //4. Click on 'remove' icon and remove the selected language:
            await languageStep.clickOnRemoveSelectedLanguageIcon();
            //5. Verify that 'Skip' button gets visible again
            await languageStep.waitForSkipButtonDisplayed();
            //6. 'Copy from parent' button gets disabled again:
            await languageStep.waitForCopyFromParentButtonDisabled();
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
