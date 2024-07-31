/**
 * Created on 23.01.2018.
 */
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');

describe('wizard.save.button.spec:  Save and Saved buttons spec', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DISPLAY_NAME = appConst.generateRandomName("folder");

    // verifies xp-apps#503  Incorrect label for button Save on the toolbar, when any data has been changed
    it(`WHEN folder-wizard is opened AND a name is typed WHEN the name has been cleared again THEN Save button should be enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Type a display name
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            await contentWizard.pause(1000);
            // 3. Verify that 'Save' button gets enabled:
            await contentWizard.waitForSaveButtonEnabled();
            // 4. Display name input has been cleared:
            await contentWizard.clearDisplayNameInput();
            await studioUtils.saveScreenshot('save_button_name_cleared');
            // 5. Verify that 'Save' button gets disabled again:
            await contentWizard.waitForSaveButtonVisible();
            await contentWizard.waitForSaveButtonDisabled();
        });

    it(`WHEN folder-wizard is opened AND name input is filled in WHEN 'Save' button has been pressed THEN 'Saved' button should be visible`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Type a display name
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            // 3. Click on Save button
            await contentWizard.waitAndClickOnSave();
            // Verify that 'Saved` button gets visible and disabled
            await contentWizard.waitForSavedButtonVisible();
        });

    it("WHEN the name that is already in use has been inserted in name-input THEN 'Save' button should be disabled, 'Not available' message appears",
        async () => {
            let wizard = new ContentWizard();
            // 1. Open wizard for new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. type the name of existing folder:
            await wizard.typeDisplayName(DISPLAY_NAME);
            // 3. Verify that 'Save' button is disabled:
            await wizard.waitForSaveButtonDisabled();
            // 4. Verify the validation message 'Not available' in path input:
            await wizard.waitForValidationPathMessageDisplayed();
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
