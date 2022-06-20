/**
 * Created on 09.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');

describe('project.wizard.custom.read.access.spec - ui-tests for updating Read Access in project', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let USER;
    let PASSWORD = appConstant.PASSWORD.MEDIUM;

    it(`Preconditions: new system user should be created`,
        async () => {
            let userName = builder.generateRandomName("user");
            await studioUtils.showLauncherPanel();
            await studioUtils.navigateToUsersApp();
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), null);
            await studioUtils.addSystemUser(USER);
        });

    it(`GIVEN new project wizard is opened WHEN Custom Read access radio has been clicked THEN just created user should be present in the selector options`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            //2. click on 'Custom' radio:
            await projectWizard.clickOnAccessModeRadio("Custom");
            //3. Select the just created user in the selector's options:
            await projectWizard.selectUserInCustomReadAccess(USER.displayName);
            await projectWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot("custom_read_access_1");
            //4. Verify that the user is added in 'Custom Read Access'
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
            studioUtils.saveScreenshot("custom_read_access_2");
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
