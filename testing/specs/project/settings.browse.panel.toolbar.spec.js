/**
 * Created on 09.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');

describe('settings.browse.panel.toolbar.spec - ui-tests to verify state of buttons in the toolbar', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`WHEN setting browse panel is opened(no selections) THEN expected button should be present in the browse toolbar`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //'New...' button should be enabled:
            await settingsBrowsePanel.waitForNewButtonEnabled();
            //'Delete' button should be disabled:
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            //'Edit' button should be disabled:
            await settingsBrowsePanel.waitForEditButtonDisabled();
        });

    it(`GIVEN setting browse panel is opened WHEN 'Projects' folder has been selected THEN 'New...' button should be enabled AND 'Edit', 'Delete' are disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Select 'Projects' folder
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConstant.PROJECTS.ROOT_FOLDER);
            studioUtils.saveScreenshot("settings_toolbar_2");
            //'New...' button should be enabled :
            await settingsBrowsePanel.waitForNewButtonEnabled();
            //'Delete' button should be disabled
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            //'Edit' button should be disabled:
            await settingsBrowsePanel.waitForEditButtonDisabled();
        });

    it(`GIVEN setting browse panel is opened WHEN 'Default' item has been selected THEN 'New...' and 'Edit' buttons should be enabled AND 'Delete' should be disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Select 'Default' folder:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConstant.PROJECTS.DEFAULT_PROJECT_NAME);
            studioUtils.saveScreenshot("settings_toolbar_2");
            //'New...' button should be enabled :
            await settingsBrowsePanel.waitForNewButtonEnabled();
            //'Delete' button should be disabled:
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            //'Edit' button gets enabled:
            await settingsBrowsePanel.waitForEditButtonEnabled();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioWithProjects();
        await studioUtils.closeProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
