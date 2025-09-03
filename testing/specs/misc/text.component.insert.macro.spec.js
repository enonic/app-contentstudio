/**
 * Created on 20.04.2022.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertMacroDialog = require('../../page_objects/wizardpanel/macro/insert.macro.dialog.cke');
const appConst = require('../../libs/app_const');

describe('Text Component - insert embed iframe and preview the site', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME =  appConst.CONTROLLER_NAME.MAIN_REGION;
    const ENONIC_IFRAME = "<iframe src='http://www.enonic.com'> enonic</iframe>";

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN embed iframe has been inserted in a text component WHEN 'Preview' button has been pressed in the wizard toolbar THEN expected iframe should be loaded in the new browser tab`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let insertMacroModalDialog = new InsertMacroDialog();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert a text component and type the not valid URL:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // 4. Open Insert Macro modal dialog:
            await textComponentCke.clickOnInsertMacroButton();
            await insertMacroModalDialog.waitForDialogLoaded();
            // 5. Select the 'Embed IFrame' option:
            await insertMacroModalDialog.selectOption('Embed IFrame');
            // 6. Insert iframe in the Configuration Text Area:
            await insertMacroModalDialog.typeTextInConfigurationTextArea(ENONIC_IFRAME);
            // 7. Click on 'Insert' button and close the modal dialog:
            await insertMacroModalDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot('embed_iframe_text_component');
            await contentWizard.waitAndClickOnSave();
            // 8. Click on 'Preview' button:
            await contentWizard.clickOnPreviewButton();
            await contentWizard.pause(3000);
            // 9. Switch to the next browser tab:
            await studioUtils.doSwitchToNextTab();
            // 10. Verify that iframe is present in the page:
            let isDisplayed = await studioUtils.isElementDisplayed(`//iframe[@src='http://www.enonic.com']`);
            await studioUtils.saveScreenshot('embed_iframe_text_component_preview');
            assert.ok(isDisplayed, 'expected iframe should be loaded in the new browser tab');
            // 12. Verify that Embed macro should not allow preview:
            await studioUtils.switchToFrameBySrc('http://www.enonic.com');
            // 13. error message should be displayed in the frame:
            //await studioUtils.waitForElementDisplayed("//div[@id='sub-frame-error']");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => {
        let insertMacroDialog = new InsertMacroDialog();
        return insertMacroDialog.isDialogOpened().then(result => {
            if (result) {
                return insertMacroDialog.clickOnCancelButton();
            }
        }).then(() => {
            return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        })
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
