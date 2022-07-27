/**
 * Created on 11.11.2020.
 */
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../libs/app_const');

describe('update.path.spec: tests for updating a content path', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let PATH_1 = contentBuilder.generateRandomName('folder');
    let PATH_2 = contentBuilder.generateRandomName('folder');

    let FOLDER;
    it(`Precondition: test folder should be added`,
        async () => {
            let displayName = "1234567";
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    //verifies:Path of a content is not refreshed in grid after updating this path in wizard #2498
    it("GIVEN existing folder is opened WHEN path has been updated THEN the path should be updated in grid",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizardPanel();
            //1. Do not filter the grid and open existing folder:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(FOLDER.displayName);
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.doSwitchToNewWizard();
            await contentWizard.waitForOpened();
            //2. Update the path:
            await contentWizard.typeInPathInput(PATH_1);
            //3. Save and close the wizard:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.doCloseWizardAndSwitchToGrid();
            //4. Verify that the folder wit updated path is displayed in not filtered grid:
            await contentBrowsePanel.waitForContentDisplayed(PATH_1);
        });

    it("GIVEN existing folder is filtered and opened WHEN path has been updated THEN the path should be updated in the filtered grid",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizardPanel();
            //1. Open Filter Panel and do filter the folder:
            await studioUtils.typeNameInFilterPanel(FOLDER.displayName);
            //2. Open the folder:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(PATH_1);
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.doSwitchToNewWizard();
            await contentWizard.waitForOpened();
            //3. Update the path and save the content:
            await contentWizard.typeInPathInput(PATH_2);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.doCloseWizardAndSwitchToGrid();
            //4. Verify that the folder with updated path is displayed in filtered grid:
            await contentBrowsePanel.waitForContentDisplayed(PATH_2);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
