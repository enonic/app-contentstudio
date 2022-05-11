/**
 * Created on 23.01.2018.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');

describe('wizard.save.button.spec:  Save and Saved buttons spec', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);

    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const DISPLAY_NAME = appConst.generateRandomName("folder");

    it(`WHEN folder-wizard is opened THEN 'Save' button should be disabled`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //Save button should be disabled, because there are no changes in  the wizard
            await contentWizard.waitForSaveButtonDisabled();
        });

    it(`WHEN folder-wizard is opened WHEN a name has been typed THEN 'Save' button is getting enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName('test999');
            //`Save` button gets enabled', because the name has been typed:
            await contentWizard.waitForSaveButtonEnabled();
        });

    //verifies xp-apps#503  Incorrect label for button Save on the toolbar, when any data has been changed
    it(`WHEN folder-wizard is opened AND a name is typed WHEN the name has been cleared again THEN Save button should be enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open new wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            await contentWizard.pause(1000);
            await contentWizard.waitForSaveButtonEnabled();
            //2. Display name input has been cleared:
            await contentWizard.clearDisplayNameInput();
            await studioUtils.saveScreenshot('save_button_clear_name');
            //3. Verify that 'Save' button gets disabled again:
            await contentWizard.waitForSaveButtonVisible();
            await contentWizard.waitForSaveButtonDisabled();
        });

    it(`WHEN folder-wizard is opened AND name input is filled in WHEN 'Save' button has been pressed THEN 'Saved' button should be visible`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            await contentWizard.pause(1000);
            await contentWizard.waitAndClickOnSave();
            //'Saved` button gets visible and disabled
            await contentWizard.waitForSavedButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
