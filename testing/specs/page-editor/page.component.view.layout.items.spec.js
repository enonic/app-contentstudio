/**
 * Created on 14.02.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const appConst = require('../../libs/app_const');

describe('page.component.view.layout.items.spec - tests for page component view items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CONTROLLER_NAME = 'main region';
    const LAYOUT_NAME = "3-col";

    it(`GIVEN 3-column layout has been inserted in new site WHEN text has been inserted in left and center layout's regions THEN expected items should be displayed in the Page Component View`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let textComponentCke = new TextComponentCke();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            // 1. Add new site
            await studioUtils.doAddSite(SITE);
            // 2. reopen the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 3. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 4. Insert the Layout component (3-column):
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await liveFormPanel.selectLayoutByDisplayName(LAYOUT_NAME);
            await contentWizard.waitForNotificationMessage();
            // TODO workaround - expand the collapsed row with the layout component:
            //await pageComponentView.clickOnRowExpander('3-col');
            // 5. Insert text component in the left layout's region
            await pageComponentView.openMenu('left');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('text left');
            // 6. Save the site: (layout get collapsed after the saving )
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('page_component_updated_1');
            // 7. Expand the layout item in Page Component View:
            await pageComponentView.expandItem(LAYOUT_NAME);
            // 8. Insert 'text component' in the left layout's region
            await pageComponentView.openMenu('center');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('text center');
            // 9. Save the site:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('page_component_updated_2');
            // 10. Verify that 'right region' item is displayed in Page Component View
            // TODO (uncomment it) workaround - expand the collapsed row with the layout component:
            // await pageComponentView.waitForItemDisplayed('right');
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
