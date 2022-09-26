/**
 * Created on 15.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils.js');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');

describe('project.wizard.panel.spec - ui-tests for project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = appConst.generateRandomName("Project1");

    it(`WHEN new project wizard is opened THEN required elements should be present in the wizard page`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'New...' button has been clicked and new project has been created:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME);
            //2. open just created project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.waitForDescriptionInputDisplayed();
            //3. Verify that Identifier input is disabled:
            await projectWizard.waitForProjectIdentifierInputDisabled()
            await projectWizard.waitForRolesComboboxDisplayed();

            //3. Verify access mode: all radio button should not be selected:
            let isSelected = await projectWizard.isAccessModeRadioSelected("Custom");
            assert.isFalse(isSelected, "'Custom' radio button should not be selected");
            //4. Verify that Private radio is selected:
            isSelected = await projectWizard.isAccessModeRadioSelected("Private");
            assert.isTrue(isSelected, "'Private' radio button should not be selected");
            isSelected = await projectWizard.isAccessModeRadioSelected("Public");
            assert.isFalse(isSelected, "'Public' radio button should not be selected");
        });

    it("Deleting a project whose name contains uppercase letters",
        async () => {
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME,PROJECT_DISPLAY_NAME.toLowerCase());
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
