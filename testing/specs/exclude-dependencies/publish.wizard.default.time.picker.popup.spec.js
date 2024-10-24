/**
 * Created on 04.04.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const DateTimePickerPopup = require('../../page_objects/wizardpanel/time/date.time.picker.popup');

describe('publish.wizard.dialog.time.picker.popup.spec - tests for configured time in Picker Popup', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;
    const CONFIGURED_TIME_IN_POPUP = '16:00';

    it(`Precondition: ready for publishing folder should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(1000);
            await studioUtils.doAddReadyFolder(FOLDER);
        });

    it(`WHEN DatePicker popup has been opened THEN config time in the 'Online From datetime picker will be set to the value of the config property('16:00')`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            // 1. Select existing 'ready' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Add schedule' button:
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 3. Open Oline from Picker popup:
            await contentPublishDialog.showOnlineFormPickerPopup();
            await studioUtils.saveScreenshot('configured_date_time_picker_popup');
            // 4. Verify the time from the popup:
            let actualTime = await dateTimePickerPopup.getTimeInOnlineFrom();
            assert.equal(actualTime, CONFIGURED_TIME_IN_POPUP,
                'The configured time (16:00) should be displayed in the online from Picker Popup');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
