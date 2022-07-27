/**
 * Created on 30.12.2021.
 */
const chai = require('chai');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');

describe('content.name.upper.lower.case.spec: tests for creating content with an upper and lower case name', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let FOLDER_1;
    const NAME_LOWER_CASE = "folder-2021";
    const NAME_UPPER_CASE = "FOLDER-2021";
    const NAME_MIXED = "FoLdEr-2021";


    it(`Preconditions: create a folder with a name in lower case`,
        async () => {
            FOLDER_1 = contentBuilder.buildFolder(NAME_LOWER_CASE);
            await studioUtils.doAddFolder(FOLDER_1);
        });

    it(`GIVEN wizard for new folder is opened WHEN existing name in upper case has been typed THEN 'Save' button gets disabled AND 'Not available' recording gets visible`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open new wizard for a folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //2. Type an existing name in upper case:
            await contentWizard.typeDisplayName(NAME_UPPER_CASE);
            //4. Verify  - 'Save' button gets disabled:
            await contentWizard.waitForSaveButtonDisabled();
            //5. Verify the validation message 'Not available' is displayed for path input:
            await contentWizard.waitForValidationPathMessageDisplayed();
        });

    it(`GIVEN wizard for new folder is opened WHEN existing name in mixed cases has been typed THEN 'Save' button gets disabled AND 'Not available' recording gets visible`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open new wizard for a folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //2. Type an existing name in mixed cases:
            await contentWizard.typeDisplayName(NAME_MIXED);
            //4. Verify  - 'Save' button gets disabled:
            await contentWizard.waitForSaveButtonDisabled();
            //5. Verify the validation message 'Not available' is displayed for path input:
            await contentWizard.waitForValidationPathMessageDisplayed();
        });

    //Verifies issue -  Impossible to add a content with name that is no longer used
    it(`GIVEN existing folder is deleted WHEN new folder with the same name has been saved THEN new folder should be created`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Delete the folder:
            await studioUtils.doDeleteContent(FOLDER_1.displayName);
            //2. Open new wizard for a folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //3. Type the name of the just deleted folder:
            await contentWizard.typeDisplayName(FOLDER_1.displayName);
            //4. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            //5. Verify that the folder is correctly saved:
            let expectedMessage = appConst.itemSavedNotificationMessage(FOLDER_1.displayName);
            await contentWizard.waitForExpectedNotificationMessage(expectedMessage);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
