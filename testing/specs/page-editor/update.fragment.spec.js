/**
 * Created on 13.02.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const appConst = require('../../libs/app_const');

describe('Test for updating text in fragment', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const SITE_NAME = appConst.generateRandomName('site');
    let CONTROLLER_NAME = 'main region';
    const GENERATED_TEXT_2 = appConst.generateRandomName('test');
    const GENERATED_TEXT_1 = appConst.generateRandomName('test');

    it(`GIVEN new fragment has been saved WHEN the text has been updated THEN text in the site's Live Form should be updated as well`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let siteFormPanel = new SiteFormPanel();
            // 1. Open wizard for new site:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(SITE_NAME);
            await siteFormPanel.filterOptionsAndSelectApplication(appConst.TEST_APPS_NAME.SIMPLE_SITE_APP);
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            await contentWizard.clickOnShowComponentViewToggler();
            // 2. Insert new text-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.insertTextInCkeEditor(GENERATED_TEXT_1);
            // 3.  Do not save the site, but save new fragment from the just inserted text:
            await pageComponentView.openMenu(GENERATED_TEXT_1);
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(700);
            // 4. Switch to Fragment wizard:
            await studioUtils.doSwitchToNewWizard();
            await contentWizard.clickOnShowComponentViewToggler();
            await pageComponentView.openMenu(GENERATED_TEXT_1);
            // 5. Update the text in the fragment
            await pageComponentView.selectMenuItem(['Edit']);
            await textComponentCke.insertTextInCkeEditorSection(GENERATED_TEXT_2);
            // 6. Save the fragment:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('fragment_txt_updated');
            // 7. Switch to the site again:
            await studioUtils.doSwitchToPrevTab();
            await studioUtils.saveScreenshot('fragment_component_txt');
            // 8. Verify  that text is updated in the Live Form panel"
            let actualTxt = await liveFormPanel.getTextInFragmentComponent();
            assert.equal(actualTxt, GENERATED_TEXT_2, 'Site wizard - Text should be updated in the fragment component');
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
