/**
 * Created on 09.03.2020.
 */
const chai = require('chai');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');

describe('settings.browse.panel.toolbar.spec - ui-tests to verify state of buttons in the toolbar', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

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

    it(`WHEN 'Projects' folder has been selected THEN 'New...' button should be enabled AND 'Edit', 'Delete' are disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Select 'Projects' folder
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConst.PROJECTS.ROOT_FOLDER);
            studioUtils.saveScreenshot("settings_toolbar_2");
            //'New...' button should be enabled :
            await settingsBrowsePanel.waitForNewButtonEnabled();
            //'Delete' button should be disabled
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            //'Edit' button should be disabled:
            await settingsBrowsePanel.waitForEditButtonDisabled();
        });

    it(`WHEN 'Default' project has been selected THEN 'New...' and 'Edit' buttons should be enabled AND 'Delete' should be disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Select 'Default' folder:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConst.PROJECTS.DEFAULT_PROJECT_NAME);
            studioUtils.saveScreenshot("settings_toolbar_2");
            //'New...' button should be enabled :
            await settingsBrowsePanel.waitForNewButtonEnabled();
            //'Delete' button should be disabled:
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            //'Edit' button gets enabled:
            await settingsBrowsePanel.waitForEditButtonEnabled();
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
