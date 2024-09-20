/**
 * Created on 23.05.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertAnchorDialog = require('../../page_objects/wizardpanel/html-area/insert.anchor.dialog.cke');
const appConst = require('../../libs/app_const');

describe('Text Component with CKE - insert Anchor specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const EXPECTED_DATA_CKE = '<a id="test_anchor" name="test_anchor"></a>';
    const VALID_ANCHOR_TEXT = 'test_anchor';
    const TEST_TEXT = 'test1';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN Text component is inserted AND 'Insert Anchor' dialog is opened WHEN 'anchor' has been inserted THEN expected text should be in the CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let insertAnchorDialog = new InsertAnchorDialog();
            // 1. Open existing site and open 'Page Component View':
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text-component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // 4. Open 'Insert Anchor' dialog and type the text:
            await textComponentCke.clickOnInsertAnchorButton();
            await insertAnchorDialog.typeInTextInput(VALID_ANCHOR_TEXT);
            await studioUtils.saveScreenshot('anchor_text_typed');
            // 5. Click on 'Insert' button and close the dialog:
            await insertAnchorDialog.clickOnInsertButtonAndWaitForClosed();
            await contentWizard.switchToLiveEditFrame();
            // 6. Verify the text in CKE:
            let actualText = await textComponentCke.getTextFromEditor();
            assert.ok(actualText.includes(EXPECTED_DATA_CKE), 'expected text should be in CKE');
        });

    // verifies XP-4949 HTML Area - Modal dialogs must handle close on Esc
    it(`GIVEN 'Insert Anchor' dialog is opened WHEN ESC key has been pressed THEN dialog should be closed`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let insertAnchorDialog = new InsertAnchorDialog();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // Open Insert Anchor modal dialog:
            await textComponentCke.clickOnInsertAnchorButton();
            // Press 'Esc' key
            await contentWizard.pressEscKey();
            await insertAnchorDialog.waitForDialogClosed();
        });

    it(`GIVEN 'Insert Anchor' dialog is opened WHEN text with whitespaces has been typed in the dialog THEN validation message should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let insertAnchorDialog = new InsertAnchorDialog();
            // 1. Open the site
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // Insert a text component:
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // Open Insert Anchor modal dialog and type not correct value:
            await textComponentCke.clickOnInsertAnchorButton();
            await insertAnchorDialog.typeInTextInput('test anchor');
            // Click on the Insert button and insert the anchor:
            await insertAnchorDialog.clickOnInsertButton();
            // Verify the validation message:
            await studioUtils.saveScreenshot('invalid_text_in_anchor');
            let msg = await insertAnchorDialog.getValidationMessage();
            assert.equal(msg, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED,
                "'Invalid value entered' should be displayed in the modal dialog");
        });

    // Verify  the issue - Page Component View - incorrect component name for the duplicated text component #3160
    // https://github.com/enonic/app-contentstudio/issues/3160
    it(`GIVEN Text component is inserted WHEN the text component has been duplicated THEN expected 2 components should be present in PCV tree`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            // 1. Open existing site and open 'Page Component View':
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text-component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            // 4. Open 'Insert Anchor' dialog and type the text:
            await textComponentCke.typeTextInCkeEditor(TEST_TEXT);
            let actualComponents = await pageComponentView.getTextComponentsDisplayName();
            assert.equal(actualComponents.length, 1, "Two items should be present in the PCV tree");
            // 5. Open  menu in the text component:
            await pageComponentView.openMenu(TEST_TEXT);
            // 6. Click on 'Duplicate' menu item.
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.DUPLICATE);
            await contentWizard.waitForNotificationMessage();
            // 7. Save button gets disabled:
            await contentWizard.waitForSaveButtonDisabled();
            // 8. Verify the text in both text-component items:
            actualComponents = await pageComponentView.getTextComponentsDisplayName();
            assert.equal(actualComponents.length, 2, "Four items should be present after the item has been duplicated");
            assert.equal(actualComponents[0], TEST_TEXT, "Expected text should be displayed in the first text-item");
            assert.equal(actualComponents[1], TEST_TEXT, "Expected text should be displayed in the second text-item");
        });

    it(`WHEN Select parent menu item has been clicked THEN expected parent item gets selected in PCV tree`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let insertAnchorDialog = new InsertAnchorDialog();
            // 1. Open existing site and open 'Page Component View':
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.waitForItemNotSelected('main');
            // 3. Open  menu in the text component:
            await pageComponentView.openMenu(TEST_TEXT);
            // 4. Click on 'Select parent' menu item.
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SELECT_PARENT);
            // 8. Verify the parent item gets selected:
            await pageComponentView.waitForItemSelected('main');
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
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
