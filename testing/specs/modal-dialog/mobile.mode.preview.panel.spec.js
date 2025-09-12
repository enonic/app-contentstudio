/**
 * Created on 25.02.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const FilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const BrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const MobileContentBrowsePanel = require('../../page_objects/browsepanel/mobile.content.browse.panel');
const MobileContentWizardPanel = require('../../page_objects/wizardpanel/mobile.content.wizard.panel');

describe('Tests for preview panel in mobile mode', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser(414, 736);
    }

    let FOLDER;
    const MOBILE_WIDTH = 414;
    const MOBILE_HEIGHT = 736;

    // Verify - Incorrect default state of the publish menu's dropdown icon #5355
    it("GIVEN wizard for new folder is opened WHEN dropdown handle has been clicked in the publish menu THEN 'down' should be added in the class selector",
        async () => {
            await studioUtils.getBrowser().setWindowSize(MOBILE_WIDTH, MOBILE_HEIGHT);
            let contentWizard = new MobileContentWizardPanel();
            // 1. Open the folder-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await studioUtils.saveScreenshot("mobile_res_414_736_1");
            // 2. Verify that 'down' should not be present in class selector :
            let isDown = await contentWizard.isPublishMenuDropdownIconDown();
            assert.ok(isDown === false, "'down' should not be present in the class selector");
            // 3. click on the dropdown handle
            await contentWizard.clickOnPublishMenuDropdownHandle();
            isDown = await contentWizard.isPublishMenuDropdownIconDown();
            // 4. Verify that 'down' has been added in the class selector
            assert.ok(isDown, "'down' should be added in the class selector");
        });

    // Verify - Incorrect default state of the publish menu's dropdown icon #5355
    it("GIVEN wizard for new folder is opened WHEN Mark as ready menu item has been clicked THEN content gets ready for publishing",
        async () => {
            await studioUtils.getBrowser().setWindowSize(MOBILE_WIDTH, MOBILE_HEIGHT);
            let contentWizard = new MobileContentWizardPanel();
            let displayName = contentBuilder.generateRandomName('folder');
            // 1. Open the folder-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName);
            await contentWizard.pause(1000);
            await studioUtils.saveScreenshot("mobile_res_414_736");
            // 2. Verify styles for Dropdown handle in Publish menu button:
            let result = await contentWizard.getPublishMenuDropdownCSSProperty("display");
            assert.equal(result, "flex", "display:flex  should be present in css properties");
            // 3. Open Publish menu and click on 'Mark as Ready' menu item
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.MARK_AS_READY);
            let expectedMessage = appConst.itemMarkedAsReadyMessage(displayName);
            await contentWizard.waitForExpectedNotificationMessage(expectedMessage);
        });

    it("GIVEN new folder has been created WHEN the folder has been filtered and clicked THEN 'Show results' button gets visible",
        async () => {
            await studioUtils.getBrowser().setWindowSize(MOBILE_WIDTH, MOBILE_HEIGHT);
            let filterPanel = new FilterPanel();
            let displayName1 = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName1);
            // 1. Open wizard for new folder , fill in the name input and save it:
            await studioUtils.doAddFolder(FOLDER);
            await studioUtils.saveScreenshot('mobile_mode_folder_added');
            // 2.Open Filter Panel, insert the name of folder
            await studioUtils.typeNameInFilterPanel(FOLDER.displayName);
            // 3. Verify that 'Show results' button gets visible:
            await filterPanel.waitForShowResultsButtonDisplayed();
        });

    it("GIVEN existing folder is filtered WHEN the folder has been clicked THEN 'Preview' panel loads and 'Hide Preview Panel' button gets visible",
        async () => {
            let filterPanel = new FilterPanel();
            let browseDetailsPanel = new BrowseDetailsPanel();
            let mobileContentBrowsePanel = new MobileContentBrowsePanel();
            // 1.Open Filter Panel, insert the name of folder
            await studioUtils.typeNameInFilterPanel(FOLDER.displayName);
            // 2. Click on 'Show results' button:
            await filterPanel.clickOnShowResultsButton();
            await mobileContentBrowsePanel.pause(1000);
            // 3. Verify that 'Details Panel' is hidden now:
            let isDetailsPanelDisplayed = await browseDetailsPanel.isPanelVisible();
            assert.ok(isDetailsPanelDisplayed === false, "Details panel should not be visible");
            // 4. Click on the folder:
            await mobileContentBrowsePanel.clickOnRowByName(FOLDER.displayName);
            await studioUtils.saveScreenshot("mobile_mode_folder_clicked");
            // 5. Verify that 'Preview Panel' should be loaded and  'Hide Preview Panel' button gets visible in the browse toolbar
            await mobileContentBrowsePanel.waitForHideMobilePreviewButtonDisplayed();
        });

    it("GIVEN existing folder has been clicked WHEN 'Show Details Panel' button has been clicked THEN 'Details Panel' gets visible",
        async () => {
            let filterPanel = new FilterPanel();
            let browseDetailsPanel = new BrowseDetailsPanel();
            let mobileContentBrowsePanel = new MobileContentBrowsePanel();
            // 1. Open 'Filter Panel', insert the name of folder
            await studioUtils.typeNameInFilterPanel(FOLDER.displayName);
            // 2. Click on 'Show results' button:
            await filterPanel.clickOnShowResultsButton();
            await mobileContentBrowsePanel.pause(1000);
            // 3. Click on the folder and load Preview Panel:
            await mobileContentBrowsePanel.clickOnRowByName(FOLDER.displayName);
            // 4. Click on 'Show Details Panel' button:
            await mobileContentBrowsePanel.clickOnDetailsPanelToggleButton();
            await studioUtils.saveScreenshot("mobile_mode_folder_details_panel");
            // 5. Verify that 'Details Panel' is loaded:
            let isDetailsPanelDisplayed = await browseDetailsPanel.isPanelVisible();
            assert.ok(isDetailsPanelDisplayed, "Details panel should be loaded");
        });

    beforeEach(() => studioUtils.navigateToContentStudioAppMobile());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(MOBILE_WIDTH, MOBILE_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
