/**
 * Created on 23.05.2018.
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
const InsertAnchorDialog = require('../../page_objects/wizardpanel/insert.anchor.dialog.cke');
const appConst = require('../../libs/app_const');

describe('Text Component with CKE - insert Anchor specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CONTROLLER_NAME = 'main region';
    let EXPECTED_DATA_CKE = '<a id="test_anchor" name="test_anchor"></a>';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN Text component is inserted AND 'Insert Anchor' dialog is opened WHEN 'anchor' has been inserted THEN expected text should be in the CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let insertAnchorDialog = new InsertAnchorDialog();
            //1. Open existing site and open 'Page Component View':
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Insert new text-component:
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.switchToLiveEditFrame();
            //3. Open 'Insert Anchor' dialog and type the text:
            await textComponentCke.clickOnInsertAnchorButton();
            await insertAnchorDialog.typeInTextInput('test_anchor');
            studioUtils.saveScreenshot('anchor_text_typed');
            //4. Click on 'Insert' button and close the dialog:
            await insertAnchorDialog.clickOnInsertButtonAndWaitForClosed();
            await contentWizard.switchToLiveEditFrame();
            //5. Verify the text in CKE:
            let actualText = await textComponentCke.getTextFromEditor();
            assert.isTrue(actualText.includes(EXPECTED_DATA_CKE), 'expected text should be in CKE');
        });

    //verifies XP-4949 HTML Area - Modal dialogs must handle close on Esc
    it(`GIVEN 'Insert Anchor' dialog is opened WHEN ESC key has been pressed THEN dialog should be closed`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let insertAnchorDialog = new InsertAnchorDialog();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();

            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.switchToLiveEditFrame();
            //Open Insert Anchor modal dialog:
            await textComponentCke.clickOnInsertAnchorButton();
            //Press 'Esc' key
            await contentWizard.pressEscKey();
            await insertAnchorDialog.waitForDialogClosed();
        });

    it(`GIVEN 'Insert Anchor' dialog is opened WHEN incorrect text has been typed in the dialog THEN validation message should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let insertAnchorDialog = new InsertAnchorDialog();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //Insert a text component:
            await contentWizard.clickOnShowComponentViewToggler();
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.switchToLiveEditFrame();
            //Open Insert Anchor modal dialog and type not correct value:
            await textComponentCke.clickOnInsertAnchorButton();
            await insertAnchorDialog.typeInTextInput('test anchor');
            //Click on the Insert button and insert the anchor:
            await insertAnchorDialog.clickOnInsertButton();
            //Verify the validation message:
            studioUtils.saveScreenshot('not_valid_text_in_anchor');
            let isDisplayed = await insertAnchorDialog.waitForValidationMessage();
            assert.isTrue(isDisplayed, 'Validation message should be present in the modal dialog');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => {
        let insertAnchorDialog = new InsertAnchorDialog();
        return insertAnchorDialog.isDialogOpened().then(result => {
            if (result) {
                return insertAnchorDialog.clickOnCancelButton();
            }
        }).then(() => {
            return insertAnchorDialog.pause(500);
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
