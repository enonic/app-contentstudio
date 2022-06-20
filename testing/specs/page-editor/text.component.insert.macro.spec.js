/**
 * Created on 20.04.2022.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertMacroDialog = require('../../page_objects/wizardpanel/macro/insert.macro.dialog.cke');
const appConst = require('../../libs/app_const');

describe('Text Component - insert embed iframe and preview the site', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CONTROLLER_NAME = 'main region';
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
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //1. Insert a text component and type the not valid URL:
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await pageComponentView.clickOnCloseButton();
            //Close the details panel
            await contentWizard.clickOnDetailsPanelToggleButton();
            await textComponentCke.switchToLiveEditFrame();
            //2. Open Insert Macro modal dialog:
            await textComponentCke.clickOnInsertMacroButton();
            await insertMacroModalDialog.waitForDialogLoaded();
            //3. Select the 'Embed IFrame' option:
            await insertMacroModalDialog.selectOption("Embed IFrame");
            //4. Insert iframe in the Configuration Text Area:
            await insertMacroModalDialog.typeTextInConfigurationTextArea(ENONIC_IFRAME);
            //5. Click on 'Insert' button and close the modal dialog:
            await insertMacroModalDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot("embed_iframe_text_component");
            await contentWizard.waitAndClickOnSave();
            //6. Click on 'Preview' button:
            await contentWizard.clickOnPreviewButton();
            await contentWizard.pause(3000);
            //7. Switch to the next browser tab:
            await studioUtils.doSwitchToNextTab();
            //8. Verify that iframe is present in the page:
            let isDisplayed = await studioUtils.isElementDisplayed(`//iframe[@src='http://www.enonic.com']`);
            await studioUtils.saveScreenshot('embed_iframe_text_component_preview');
            assert.isTrue(isDisplayed, 'expected iframe should be loaded in the new browser tab');
            //9. Verify that Embed macro should not allow preview:
            await studioUtils.switchToFrameBySrc('http://www.enonic.com');
            //10. error message should be displayed in the frame:
            //await studioUtils.waitForElementDisplayed("//div[contains(@id,'sub-frame-error')]");
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
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
