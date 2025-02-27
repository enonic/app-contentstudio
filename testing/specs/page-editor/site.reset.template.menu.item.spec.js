/**
 * Created on 06.09.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const appConst = require('../../libs/app_const');

describe('site.reset.template.menu.item.spec - resets a site to default template', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CONTROLLER_NAME = 'Country Region';
    let TEST_TEXT = 'test text';
    let TEMPLATE;

    it(`Preconditions: new site and a page template with a text component should be added`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();

            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.MY_FIRST_APP]);
            await studioUtils.doAddSite(SITE);

            //1. Expand the site and add a template:
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, "Site", CONTROLLER_NAME);
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            await contentWizard.typeData(TEMPLATE);
            await contentWizard.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3.Click on the item and open Context Menu:
            await pageComponentView.openMenu('country');
            // 4. Insert Text Component with 'test text' and save it:
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor(TEST_TEXT);
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN text component has been removed in 'Page Component View' WHEN 'Reset' menu item has been clicked in 'Page Component View' THEN site should be reset to default template`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            // 1. Open the site
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.switchToParentFrame();
            // 2. Unlock the LiveEdit- click on 'Customize' menu item:
            await contentWizard.doUnlockLiveEditor();
            await contentWizard.switchToMainFrame();
            // 3. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 4. Click on the item and open Context Menu:
            await pageComponentView.openMenu(TEST_TEXT);
            // 5. Remove the text component and save it
            await pageComponentView.selectMenuItem(['Remove']);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('site_txt_component_customized');
            // 6. Verify that  number of components is reduced:
            let result1 = await pageComponentView.getPageComponentsDisplayName();
            assert.equal(result1.length, 2, "Number of items in Component View should be reduced after the removing");
            // 7. Expand the controller's menu(the root element) and click on 'Reset' item
            await pageComponentView.openMenu(CONTROLLER_NAME);
            await pageComponentView.selectMenuItem(['Reset']);
            await pageComponentView.pause(4000);
            // 8. Click on 'Customize' menu item in Live Edit frame:
            await contentWizard.doUnlockLiveEditor();
            // 9 Switch to main frame:
            await contentWizard.switchToMainFrame();
            await studioUtils.saveScreenshot('site_reset_to_template');
            // 10. Verify that the site is reset to default template:
            let result2 = await pageComponentView.getPageComponentsDisplayName();
            assert.equal(result2.length, 3,
                "Number of items in 'Component View' should be increased after the resetting to the default template");
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
