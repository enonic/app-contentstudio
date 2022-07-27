/**
 * Created on 25.02.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const FilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const BrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.details.panel');
const MobileContentBrowsePanel = require('../../page_objects/browsepanel/mobile.content.browse.panel');

describe('Tests for preview panel in mobile mode', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        //set the mobile resolution:
        webDriverHelper.setupBrowser(414, 736);
    }
    let FOLDER;


    it("GIVEN new folder has been created WHEN the folder has been filtered and clicked THEN 'Show results' button gets visible",
        async () => {
            let filterPanel = new FilterPanel();
            let displayName1 = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName1);
            //1. Open wizard for new folder , fill in the name input and save it:
            await studioUtils.doAddFolder(FOLDER);
            await studioUtils.saveScreenshot("mobile_mode_folder_added");
            //2.Open Filter Panel, insert the name of folder
            await studioUtils.typeNameInFilterPanel(FOLDER.displayName);
            //3. Verify that 'Show results' button gets visible:
            await filterPanel.waitForShowResultsButtonDisplayed();
        });

    it("GIVEN existing folder is filtered WHEN the folder has been clicked THEN 'Preview' panel loads and 'Hide Preview Panel' button gets visible",
        async () => {
            let filterPanel = new FilterPanel();
            let browseDetailsPanel = new BrowseDetailsPanel();
            let mobileContentBrowsePanel = new MobileContentBrowsePanel();
            //1.Open Filter Panel, insert the name of folder
            await studioUtils.typeNameInFilterPanel(FOLDER.displayName);
            //2. Click on 'Show results' button:
            await filterPanel.clickOnShowResultsButton();
            await mobileContentBrowsePanel.pause(1000);
            //3. Verify that 'Details Panel' is hidden now:
            let isDetailsPanelDisplayed = await browseDetailsPanel.isPanelVisible();
            assert.isFalse(isDetailsPanelDisplayed, "Details panel should not be visible");
            //4. Click on the folder:
            await mobileContentBrowsePanel.clickOnRowByName(FOLDER.displayName);
            await studioUtils.saveScreenshot("mobile_mode_folder_clicked");
            //5. Verify that 'Preview Panel' should be loaded and  'Hide Preview Panel' button gets visible in the browse toolbar
            await mobileContentBrowsePanel.waitForHideMobilePreviewButtonDisplayed();
        });

    it("GIVEN existing folder has been clicked WHEN 'Show Details Panel' button has been clicked THEN 'Details Panel' gets visible",
        async () => {
            let filterPanel = new FilterPanel();
            let browseDetailsPanel = new BrowseDetailsPanel();
            let mobileContentBrowsePanel = new MobileContentBrowsePanel();
            //1.Open 'Filter Panel', insert the name of folder
            await studioUtils.typeNameInFilterPanel(FOLDER.displayName);
            //2. Click on 'Show results' button:
            await filterPanel.clickOnShowResultsButton();
            await mobileContentBrowsePanel.pause(1000);
            //3. Click on the folder and load Preview Panel:
            await mobileContentBrowsePanel.clickOnRowByName(FOLDER.displayName);
            //4. Click on 'Show Details Panel' button:
            await mobileContentBrowsePanel.clickOnDetailsPanelToggleButton();
            await studioUtils.saveScreenshot("mobile_mode_folder_details_panel");
            //5. Verify that 'Details Panel' is loaded:
            let isDetailsPanelDisplayed = await browseDetailsPanel.isPanelVisible();
            assert.isTrue(isDetailsPanelDisplayed, "Details panel should be loaded");
        });

    beforeEach(() => studioUtils.navigateToContentStudioAppMobile());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(414, 736);
        }
        return console.log('specification starting: ' + this.title);
    });
});
