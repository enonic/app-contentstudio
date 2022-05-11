/**
 * Created on 11.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const NewSettingsItemDialog = require('../../page_objects/project/new.settings.item.dialog');

describe('new.settings.item.dialog.spec - ui-tests for New Settings Item Dialog', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN settings browse panel is opened WHEN 'New...' button has been pressed THEN 'NewSettingsItem' dialog should be opened`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let newSettingsItemDialog = new NewSettingsItemDialog();
            //1.'New...' button has been clicked:
            await settingsBrowsePanel.clickOnNewButton();
            //2. 'NewSettingsItem' dialog should be loaded:
            await newSettingsItemDialog.waitForDialogLoaded();
            //3. Expected title should be loaded:
            let actualTitle = await newSettingsItemDialog.getTitle();
            assert.equal(actualTitle, "Create New");
            //4. Required buttons should be present:
            await newSettingsItemDialog.waitForCancelButtonDisplayed();
            await newSettingsItemDialog.waitForCancelButtonTopDisplayed();
            //5. Verify that Layer and Project dialog items are present:
            await newSettingsItemDialog.waitForProjectDialogItem();
            await newSettingsItemDialog.waitForLayerDialogItem();
        });

    it(`GIVEN NewSettingsItem is opened WHEN 'Cancel' button has been pressed THEN the dialog should be closed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let newSettingsItemDialog = new NewSettingsItemDialog();
            //2.'New...' button has been clicked:
            await settingsBrowsePanel.clickOnNewButton();
            //2. 'NewSettingsItem' dialog should be loaded:
            await newSettingsItemDialog.waitForDialogLoaded();
            studioUtils.saveScreenshot("setting_item_dialog_1");
            //3. 'Cancel' button has been clicked
            await newSettingsItemDialog.clickOnCancelButton();
            await newSettingsItemDialog.waitForDialogClosed();
        });

    it(`GIVEN NewSettingsItem dialog is opened WHEN 'Cancel Top' button has been pressed THEN the dialog should be closed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let newSettingsItemDialog = new NewSettingsItemDialog();
            //1.'New...' button has been clicked:
            await settingsBrowsePanel.clickOnNewButton();
            //2. 'NewSettingsItem' dialog should be loaded:
            await newSettingsItemDialog.waitForDialogLoaded();
            //3. 'Cancel Top' button has been clicked:
            await newSettingsItemDialog.clickOnCancelButtonTop();
            await newSettingsItemDialog.waitForDialogClosed();
        });

    it(`GIVEN NewSettingsItem dialog is opened WHEN 'ESC' key has been pressed THEN the dialog should be closed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let newSettingsItemDialog = new NewSettingsItemDialog();
            //1.'New...' button has been clicked:
            await settingsBrowsePanel.clickOnNewButton();
            //2. 'NewSettingsItem' dialog should be loaded:
            await newSettingsItemDialog.waitForDialogLoaded();
            //3. 'Esc' key has been clicked:
            await newSettingsItemDialog.pressEscKey();
            await newSettingsItemDialog.waitForDialogClosed();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
