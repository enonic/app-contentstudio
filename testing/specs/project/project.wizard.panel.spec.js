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

describe('project.wizard.panel.spec - ui-tests for project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = "Project1";

    it(`WHEN new project wizard is opened THEN required elements should be present in the wizard page`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            studioUtils.saveScreenshot("project_wizard_1");
            //2. Verify all inputs and tab-title:
            let tabTitle = await projectWizard.getTabTitle();
            assert.equal(tabTitle, "<Unnamed Project>", "Expected title should be displayed");
            await projectWizard.waitForDescriptionInputDisplayed();
            await projectWizard.waitForProjectIdentifierInputDisplayed();
            await projectWizard.waitForRolesComboboxDisplayed();

            //3. Verify access mode: all radio button should not be selected:
            let isSelected = await projectWizard.isAccessModeRadioSelected("Custom");
            assert.isFalse(isSelected, "'Custom' radio button should not be selected");
            isSelected = await projectWizard.isAccessModeRadioSelected("Private");
            assert.isFalse(isSelected, "'Private' radio button should not be selected");
            isSelected = await projectWizard.isAccessModeRadioSelected("Public");
            assert.isFalse(isSelected, "'Public' radio button should not be selected");
        });

    it(`GIVEN new project wizard is opened WHEN display name has been typed THEN the same text should appear in project-name input`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type the display name:
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            studioUtils.saveScreenshot("project_wizard_2");
            let actualProjectName = await projectWizard.getProjectIdentifier();
            //3. Verify that display name and the identifier are equal:
            assert.equal(PROJECT_DISPLAY_NAME.toLowerCase(), actualProjectName);
        });

    it(`GIVEN new project wizard is opened WHEN 'SU' has been selected in 'Project Access' THEN the item should appear in the selected options`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Select 'Super User' in in Roles Access combobox:
            await projectWizard.selectProjectAccessRoles(appConst.systemUsersDisplayName.SUPER_USER);
            studioUtils.saveScreenshot("project_wizard_3");
            let projectAccessItems = await projectWizard.getSelectedProjectAccessItems();
            assert.equal(projectAccessItems.length, 1, "One access item should be present");
            assert.equal(projectAccessItems[0], appConst.systemUsersDisplayName.SUPER_USER,
                "Expected item should be displayed in selected options");

            let actualRole = await projectWizard.getSelectedRoleInProjectAccessControlEntry("su");
            assert.equal(actualRole, appConst.PROJECT_ROLES.CONTRIBUTOR, "Contributor role should be set by default");
        });

    it(`GIVEN 'SU' is selected in Project Access WHEN the item has been removed THEN the item should not be present in the selected options`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Select 'Super User' in Roles Access combobox:
            await projectWizard.selectProjectAccessRoles(appConst.systemUsersDisplayName.SUPER_USER);
            //3. Remove the item:
            await projectWizard.removeProjectAccessItem("su");
            studioUtils.saveScreenshot("project_wizard_4");
            let projectAccessItems = await projectWizard.getSelectedProjectAccessItems();
            assert.equal(projectAccessItems.length, 0, "no selected options should be in 'project access'");
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
