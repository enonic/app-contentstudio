/**
 * Created on 17.01.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const HtmlAreaForm = require('../page_objects/wizardpanel/htmlarea.form.panel');
const InsertImageDialog = require('../page_objects/wizardpanel/insert.image.dialog.cke');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');

describe('insert.image.dlg.apply.custom.style.spec: apply a custom style to an image', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let IMAGE_DISPLAY_NAME = "Pop_03";
    let HTML_AREA_CONTENT_NAME = contentBuilder.generateRandomName('hrtmlarea');

    it(`Preconditions: site should be added`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            let contentBrowsePanel = new ContentBrowsePanel();
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`GIVEN htmlarea-content, image is selected on the modal dialog WHEN click on dropdown handle in styles selector THEN custom styles should be present`,
        () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
            }).then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            }).then(() => {
                return insertImageDialog.waitForDialogVisible();
            }).then(() => {
                return insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            }).then(() => {
                //click on dropdown handle and open style-options
                return insertImageDialog.getStyleSelectorOptions();
            }).then(result => {
                studioUtils.saveScreenshot('image_dialog_custom_style_options');
                assert.isTrue(result[2] == "Cinema", "Cinema should be present in options list");
                assert.isTrue(result[3] == "Tall", "Tall option should be present in options list");
                assert.isTrue(result.length == 7, "Expected number of options be present in options list");

            });
        });

    it(`GIVEN Insert Image modal dialog opened WHEN 'Cinema' option has been selected THEN 'Custom Width' checkbox should be enabled`,
        () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
            }).then(() => {
                return contentWizard.typeDisplayName(HTML_AREA_CONTENT_NAME);
            }).then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            }).then(() => {
                return insertImageDialog.waitForDialogVisible();
            }).then(() => {
                return insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            }).then(() => {
                //type a option in 'filter input' and click on the option
                return insertImageDialog.doFilterStyleAndClickOnOption("Cinema");
            }).then(() => {
                //checkbox should be enabled
                return expect(insertImageDialog.waitForCustomWidthCheckBoxEnabled()).to.eventually.true;
            }).then(() => {
                //checkbox should be unselected
                return expect(insertImageDialog.isCustomWidthCheckBoxSelected()).to.eventually.false;
            }).then(() => {
                // just save the changes and save the content
                return insertImageDialog.clickOnInsertButton();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            });
        });

    it(`GIVEN existing htmlarea-content with inserted image(Custom Style) is opened WHEN double click in htmmlarea THEN expected style should be present in style selector`,
        () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            return studioUtils.selectContentAndOpenWizard(HTML_AREA_CONTENT_NAME).then(()=>{
                return htmlAreaForm.pause(2000);
            }).then(() => {
                return htmlAreaForm.doubleClickOnHtmlArea();
            }).then(() => {
                return insertImageDialog.waitForDialogVisible();
            }).then(() => {
                return insertImageDialog.getSelectedStyleName();
            }).then(result => {
                // Cinema style should be selected in the dialog
                studioUtils.saveScreenshot('image_dialog_custom_style_should_be_cinema');
                assert.equal(result, 'Cinema', "Expected style should be present in the selector");
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
