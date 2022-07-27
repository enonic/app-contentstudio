/**
 * Created on 01.03.2022
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const MobileContentBrowsePanel = require('../../page_objects/browsepanel/mobile.content.browse.panel');
const FilterPanel = require('../../page_objects/browsepanel/content.filter.panel');

describe('Tests for browse panel toolbar in mobile mode', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser(414, 736);
    }

    it("WHEN Mobile Browse panel is loaded THEN 'New' button should be enabled, 'Edit...','Archive..' buttons should be disabled",
        async () => {
            let mobileContentBrowsePanel = new MobileContentBrowsePanel();
            //1. 'New' button should be enabled, 'Edit...','Archive..' buttons should be disabled
            await mobileContentBrowsePanel.waitForNewButtonEnabled();
            await mobileContentBrowsePanel.waitForEditButtonDisabled();
            await mobileContentBrowsePanel.waitForArchiveButtonDisabled();

            //2. Click on 'More' button and expand the folded buttons:
            await mobileContentBrowsePanel.clickOnMoreFoldButton();
            await studioUtils.saveScreenshot("mobile_folded_buttons");
            //3. Folded 'Move...' button should be disabled
            await mobileContentBrowsePanel.waitForMoveFoldedButtonDisabled();
            //3. Folded 'Sort...' button should be disabled
            await mobileContentBrowsePanel.waitForSortFoldedButtonDisabled();
            //4. Folded 'Preview...' button should be disabled
            await mobileContentBrowsePanel.waitForPreviewFoldedButtonDisabled();
            await mobileContentBrowsePanel.waitForDuplicateFoldedButtonDisabled();
        });

    it("GIVEN existing folder is selected and preview panel is loaded WHEN 'fold' button has been clicked THEN 'New' 'Edit','Archive...','Duplicate...' ,'Move..','Sort...', 'Preview','Publish...' buttons gets visible",
        async () => {
            let filterPanel = new FilterPanel();
            let mobileContentBrowsePanel = new MobileContentBrowsePanel();
            //1.Open Filter Panel, type the name of folder
            await studioUtils.typeNameInFilterPanel(appConst.TEST_FOLDER_NAME);
            //2. Click on 'Show results' button:
            await filterPanel.clickOnShowResultsButton();
            //3. Load the Preview panel:
            await mobileContentBrowsePanel.clickOnRowByName(appConst.TEST_FOLDER_NAME);
            await mobileContentBrowsePanel.waitForHideMobilePreviewButtonDisplayed();
            //4. Click on Fold button and expand the menu:
            await mobileContentBrowsePanel.clickOnFoldWithNameButton(appConst.TEST_FOLDER_WITH_IMAGES);
            await studioUtils.saveScreenshot("mobile_folded_buttons_preview_panel");
            //5. Verify buttons New, Edit, Archive, Duplicate, Move, Publish should be enabled:
            await mobileContentBrowsePanel.waitForNewFoldedButtonEnabled();
            await mobileContentBrowsePanel.waitForEditFoldedButtonEnabled();
            await mobileContentBrowsePanel.waitForArchiveFoldedButtonEnabled();
            await mobileContentBrowsePanel.waitForDuplicateFoldedButtonEnabled();
            await mobileContentBrowsePanel.waitForMoveFoldedButtonEnabled();
            await mobileContentBrowsePanel.waitForPublishFoldedButtonEnabled();
            //6. Folded 'Preview...' button should be disabled
            await mobileContentBrowsePanel.waitForPreviewFoldedButtonDisabled();
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
