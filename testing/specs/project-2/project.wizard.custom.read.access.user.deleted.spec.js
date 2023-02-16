/**
 * Created on 09.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');

describe('project.wizard.custom.read.access.spec - ui-tests for updating Read Access in project', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let USER;
    let PASSWORD = appConst.PASSWORD.MEDIUM;

    it(`Preconditions: new system user should be created`,
        async () => {
            let userName = builder.generateRandomName("user");
            await studioUtils.showLauncherPanel();
            await studioUtils.navigateToUsersApp();
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), null);
            await studioUtils.addSystemUser(USER);
        });

    it(`GIVEN access mode step is opened WHEN Custom Read access radio has been clicked THEN just created user should be present in the selector options`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let projectWizard = new ProjectWizard();
            //1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            //2. Select Project-radio then click on Next button:
            await parentProjectStep.clickOnProjectRadioButton();
            await parentProjectStep.clickOnNextButton();
            //3. Skip the language step:
            await languageStep.clickOnSkipButton();
            //4. Select Custom access mode:
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.CUSTOM);
            //5. Select just created user in the dropdown selector:
            await accessModeStep.selectUserInCustomReadAccessSelector(USER.displayName);
            await studioUtils.saveScreenshot("custom_read_access_1");
            await accessModeStep.clickOnNextButton();
            //6. Skip permissions step:
            await permissionsStep.clickOnSkipButton();
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            let summaryStep =  await projectUtils.fillNameAndDescriptionStep(PROJECT_DISPLAY_NAME);
            await summaryStep.waitForLoaded();
            //7. Click on  Create button
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            //8. Open the project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //9. Verify that the user is present in 'Custom Read Access'
            let result = await projectWizard.getSelectedCustomReadAccessOptions();
            assert.equal(result.length, 1, "One option should be selected in Custom Read Access");
            assert.equal(result[0], USER.displayName, "expected user should be in 'Custom Read Access'");
        });

    it(`intermediate condition: The User should be deleted`,
        async () => {
            await studioUtils.showLauncherPanel();
            await studioUtils.navigateToUsersApp();
            await studioUtils.selectAndDeleteUserItem(USER.displayName);
        });

    it(`WHEN existing project(Custom Read Access) is opened AND selected user was deleted THEN 'Private' radio should be selected`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await studioUtils.saveScreenshot("custom_read_access_2");
            //2. Verify that 'Private' radio button is selected.
            let isSelected = await projectWizard.isAccessModeRadioSelected("Custom");
            assert.isFalse(isSelected, "'Custom' radio button should not be selected");
            isSelected = await projectWizard.isAccessModeRadioSelected("Private");
            assert.isTrue(isSelected, "'Private' radio button should be selected");
            isSelected = await projectWizard.isAccessModeRadioSelected("Public");
            assert.isFalse(isSelected, "'Public' radio button should not be selected");
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
