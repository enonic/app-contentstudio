/**
 * Created on 15.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const NewSettingsItemDialog = require('../../page_objects/project/new.settings.item.dialog');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');

describe('project.wizard.panel.spec - ui-tests for project wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

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
            await projectWizard.waitForProjectNameInputDisplayed();
            await projectWizard.waitForProjectAccessSelectorDisplayed();
        });

    it(`GIVEN new project wizard is opened WHEN display name has been typed THEN the same text should appear in project-name input`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type the display name:
            await projectWizard.typeName(PROJECT_DISPLAY_NAME);
            studioUtils.saveScreenshot("project_wizard_2");
            let actualProjectName = await projectWizard.getProjectName();
            //3. Verify that display name and project name are equal:
            assert.equal(PROJECT_DISPLAY_NAME.toLowerCase(), actualProjectName);
        });

    it(`GIVEN new project wizard is opened WHEN an 'Access Item' has been selected THEN the item should appear in 'project access'`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Select 'Anonymous User' in Access Items selector:
            await projectWizard.selectAccessItem(appConstant.systemUsersDisplayName.ANONYMOUS_USER);
            studioUtils.saveScreenshot("project_wizard_3");
            let items = await projectWizard.getSelectedAccessItems();
            assert.equal(items.length, 1, "One access item should be present");
            assert.equal(items[0], appConstant.systemUsersDisplayName.ANONYMOUS_USER,
                "Expected item should be displayed in selected options");
        });

    it(`GIVEN an 'Access Item' is selected WHEN the item has been removed THEN the item should not be present in 'selected options'`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Select 'Anonymous User' in Access Items selector:
            await projectWizard.selectAccessItem(appConstant.systemUsersDisplayName.ANONYMOUS_USER);
            //3. Remove the item:
            await projectWizard.removeAccessItem("anonymous");
            studioUtils.saveScreenshot("project_wizard_4");
            let items = await projectWizard.getSelectedAccessItems();
            assert.equal(items.length, 0, "no selected options should be in 'project access'");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
        await studioUtils.closeProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
