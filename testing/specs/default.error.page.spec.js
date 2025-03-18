/**
 * Created on 25.09.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const PageComponentView = require("../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../page_objects/wizardpanel/liveform/live.form.panel");
const appConst = require('../libs/app_const');

describe('default.error.page.spec tests for Default error page', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = 'main region';
    const ERROR_PART_NAME = appConst.PART_NAME.PART_WITH_ERROR;

    it(`Preconditions: test site should be created`, async () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, 'description', ['First Selenium App'], CONTROLLER_NAME);
        await studioUtils.doAddSite(SITE);
    });

    it("WHEN part with errors has been inserted WHEN 'Preview' button has been pressed THEN default error page should be loaded",
        async () => {
            let liveFormPanel = new LiveFormPanel();
            let contentWizard = new ContentWizardPanel();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 1. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. open the context menu
            await pageComponentView.openMenu('main');
            // 3. click on the 'Insert Part' menu item:
            await pageComponentView.selectMenuItem([appConst.PCV_MENU_ITEM.INSERT, appConst.PCV_MENU_ITEM.PART]);
            // 4. Select the part with errors:
            await liveFormPanel.selectPartByDisplayName(ERROR_PART_NAME);
            await contentWizard.switchToMainFrame();
            // 5. Click on 'Preview' button:
            await contentWizard.clickOnPreviewButton();
            await studioUtils.doSwitchToNextTab();
            await studioUtils.saveScreenshot('default-error-page');
            // 6. Verify that Default Error Page is loaded:
            let pageSource = await studioUtils.getPageSource();
            assert.ok(pageSource.includes("500 - Internal Server Error"), "Expected title should be loaded");
            assert.ok(pageSource.includes("D'oh!"), "Expected message should be loaded");
        });

    it("WHEN part with errors has been removed THEN new inserted component should be displayed without the red icon",
        async () => {
            let liveFormPanel = new LiveFormPanel();
            let contentWizard = new ContentWizardPanel();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 1. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. open the context menu for part with errors
            await pageComponentView.openMenu(ERROR_PART_NAME);
            // 3. click on the 'Remove' menu item in PCV and remove the part-component
            await pageComponentView.selectMenuItem([appConst.PCV_MENU_ITEM.REMOVE]);
            await pageComponentView.openMenu('main');
            // 4. click on the 'Insert Part' menu item:
            await pageComponentView.selectMenuItem([appConst.PCV_MENU_ITEM.INSERT, appConst.PCV_MENU_ITEM.LAYOUT]);
            await liveFormPanel.selectLayoutByDisplayName(appConst.LAYOUT_NAME.CENTERED);
            await contentWizard.waitForNotificationMessage();
            // 5. Verify that red icon is not displayed beside the layout-component in the PCV:
            let isInvalid = await pageComponentView.isComponentItemInvalid(appConst.LAYOUT_NAME.CENTERED);
            assert.ok(isInvalid=== false, 'The layout-component should be displayed as valid in PCV');
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
