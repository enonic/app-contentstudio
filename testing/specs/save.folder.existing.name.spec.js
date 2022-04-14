/**
 * Created on 11.11.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');

describe('save.folder.existing.name.spec: Save a folder with a name that is already in use', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;

    it("Preconditions: new folder should be added",
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(TEST_FOLDER);
        });

    it("GIVEN new wizard is opened WHEN type the existing name AND click on Save button THEN Save button should be disabled after failed attempt to save the content",
        async () => {
            let wizard = new ContentWizard();
            //1. Open new folder-wizard:
            await studioUtils.openContentWizard(appConstant.contentTypes.FOLDER);
            //2. type the name of existing folder:
            await wizard.typeDisplayName(TEST_FOLDER.displayName);
            //3. 'Save' button should be disabled:
            await wizard.waitForSaveButtonDisabled();
            //4. Verify the validation message 'Not available' is displayed in displayName input:
            await wizard.waitForValidationPathMessageDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
