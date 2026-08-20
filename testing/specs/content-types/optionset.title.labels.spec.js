/**
 * Created on 22.01.2021. updated on 18.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const OptionSetForm = require('../../page_objects/wizardpanel/optionset/optionset.form.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SingleSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/single.selection.option.set.view');
const MultiSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/multi.selection.set.view');
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const OptionSetForm2View = require('../../page_objects/wizardpanel/optionset/optionset.form2.view');
const appConst = require('../../libs/app_const');

describe("optionset.title.labels.spec: checks option set's title and labels", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const SINGLE_SELECTION_NOTE1 = 'single test';
    const SINGLE_SELECTION_NOTE2 = 'single test 2';
    const MULTI_SELECTION_TITLE1 = 'Option 2';
    const MULTI_SELECTION_TITLE2 = 'Option 1, Option 2';
    const OPTION_SET_NAME1 = contentBuilder.generateRandomName('optionset');
    const OPTION_SET_NAME = contentBuilder.generateRandomName('optionset');

    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;

    it('GIVEN new Option Set wizard(required input) is opened AND name input is filled in WHEN Save button has been pressed THEN the content should be invalid', async () => {
        let contentWizard = new ContentWizard();
        let optionSetForm2 = new OptionSetForm2View();
        // 1. Open the new wizard:
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.OPTION_SET2);
        // 2. Fill in the name input:
        await contentWizard.typeDisplayName(contentBuilder.generateRandomName('optionset'));
        await contentWizard.waitAndClickOnSave();
        // 4. Verify that content gets invalid
        await contentWizard.waitUntilInvalidIconAppears();
        let validationRecording = await optionSetForm2.getOptionSetValidationRecording();
        assert.equal(
            validationRecording,
            'At least one option must be selected',
            'expected validation recording should appear',
        );
    });

    it('GIVEN new Option Set wizard is opened AND option with required image selector is selected WHEN the content has been saved THEN the content becomes invalid', async () => {
        let contentWizard = new ContentWizard();
        let optionSetForm2 = new OptionSetForm2View();
        // 1. Open the new wizard:
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.OPTION_SET2);
        await contentWizard.typeDisplayName(contentBuilder.generateRandomName('optionset'));
        // 2. Select 'Text block' option
        await optionSetForm2.selectOption('Text block');
        await optionSetForm2.clickOnCheckboxByLabel('Sidebar image');
        // 4. Save the content
        await contentWizard.waitAndClickOnSave();
        // 6. Verify that the content becomes invalid, because the image selector is required
        await contentWizard.waitUntilInvalidIconAppears();
        // 7. Select another option without required inputs:
        await optionSetForm2.selectOption('Images');
        let result = await contentWizard.waitForNotificationMessages();
        let expectedMsg = 'The fields inside unselected option will be cleared on save!';
        assert.ok(result.includes(expectedMsg), `Expected notification message should be displayed: ${expectedMsg}`);
        // 8. Verify  that the content becomes valid:
        await contentWizard.waitUntilInvalidIconDisappears();
    });

    it("GIVEN wizard for new option set is opened WHEN options in multi select have been updated THEN title of 'multi select' should be updated dynamically", async () => {
        let contentWizard = new ContentWizard();
        let multiSelectionOptionSet = new MultiSelectionOptionSet();
        // 1. Open the new wizard:
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.OPTION_SET);
        await contentWizard.typeDisplayName(OPTION_SET_NAME1);
        // 2. Verify that 'Option 2' is selected by default:
        let isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 2');
        assert.ok(isSelected, "'Option 2' should be selected by default");
        // 3. Unselect the default 'option' 2:
        await multiSelectionOptionSet.clickOnOption('Option 2');
        // 4. Verify that 'Option 2' is not selected
        isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 2');
        assert.ok(isSelected === false, "'Option 2' should not be selected after unselecting the radio");
        await contentWizard.waitAndClickOnSave();
        await contentWizard.pause(1000);
        // 5. Verify that 'Option 2' remains unselected after the saving:
        isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 2');
        assert.ok(isSelected === false, "'Option 2' should not be selected after the saving");
    });

    it('GIVEN radio buttons were unselected in the previous test WHEN the content has been re-opened THEN all radio buttons should be unselected', async () => {
        let multiSelectionOptionSet = new MultiSelectionOptionSet();
        // 1. Open an existing option set content:
        await studioUtils.selectAndOpenContentInWizard(OPTION_SET_NAME1);
        await studioUtils.saveScreenshot('optionset_all_radio_unselected');
        // 2. Verify that all radio buttons are unselected:
        let isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 1');
        assert.ok(isSelected === false, "'Option 1' should not be selected");
        isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 2');
        assert.ok(isSelected === false, "'Option 2' should not be selected");
        isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 3');
        assert.ok(isSelected === false, "'Option 3' should not be selected");
        isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 4');
        assert.ok(isSelected === false, "'Option 4' should not be selected");
        let message = await multiSelectionOptionSet.getValidationMessage();
        assert.equal(
            message,
            'At least one option must be selected',
            'expected validation message should be displayed',
        );
    });

    it(`GIVEN wizard for new option set is opened WHEN text in name input is updated THEN title of ItemSet occurrence should be updated dynamically`, async () => {
        let singleSelectionOptionSet = new SingleSelectionOptionSet();
        // 1. Open the new wizard: optionset
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.OPTION_SET);
        // 2. Select 'Option 1' :
        await singleSelectionOptionSet.selectOption('Option 1');
        // 3. Verify that the title is equal to text in 'Name' input
        await singleSelectionOptionSet.typeInLabelInput(SINGLE_SELECTION_NOTE1, 0);
        // 4. Verify that title of ItemSet occurrence should be updated dynamically:
        let subtitle = await singleSelectionOptionSet.getItemSetOccurrenceName();
        assert.equal(subtitle, SINGLE_SELECTION_NOTE1, 'Expected label should be displayed');
        // 5. Update the text in input:
        await singleSelectionOptionSet.typeTextInOptionNameInput(SINGLE_SELECTION_NOTE2);
        // 6. Verify the subtitle of Single Selection :
        let title = await singleSelectionOptionSet.getSingleSelectionSubtitle();
        assert.equal(title, 'Single selection radio option set', 'Expected subheader should be displayed');
    });

    it(`WHEN options in multi select have been updated THEN Item Label in 'multi select' should be updated dynamically`, async () => {
        let contentWizard = new ContentWizard();
        let multiSelectionOptionSet = new MultiSelectionOptionSet();
        let optionSetForm = new OptionSetForm();
        let singleSelectionOptionSet = new SingleSelectionOptionSet();
        // 1. Open the new wizard:
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.OPTION_SET);
        await optionSetForm.selectOptionInSingleSelection('Option 1');
        await singleSelectionOptionSet.typeTextInOptionNameInput('test 1');
        await contentWizard.typeDisplayName(OPTION_SET_NAME);
        //2. Verify the title in multi selection form:
        let title = await multiSelectionOptionSet.getMultiSelectionItemLabel();
        assert.equal(title, 'Option 2', "Expected title should be in 'multi selection' form");
        // 3. Click on the second option:
        await multiSelectionOptionSet.clickOnOption('Option 1');
        await contentWizard.waitAndClickOnSave();
        await contentWizard.waitForNotificationMessage();
        // 4. Verify that title is updated dynamically in the multi selection form:
        title = await multiSelectionOptionSet.getMultiSelectionItemLabel();
        assert.equal(
            title,
            MULTI_SELECTION_TITLE2,
            "'Option 1 Option 2' should be displayed in multi selection subtitle",
        );
        let isInvalid = await contentWizard.isContentInvalid();
        assert.ok(isInvalid === false, 'Option Set content should be valid because required input are filled');
    });

    it(`WHEN existing option set is opened THEN expected options should be selected in multi selection`, async () => {
        let multiSelectionOptionSet = new MultiSelectionOptionSet();
        // 1. Open existing Option Set content:
        await studioUtils.selectAndOpenContentInWizard(OPTION_SET_NAME);
        // 2. Verify selected checkboxes:
        let isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 1');
        assert.ok(isSelected, "'Option 1' should be selected");
        isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 2');
        assert.ok(isSelected, "'Option 2' should  be selected");
        isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 3');
        assert.ok(isSelected === false, "'Option 3' should not be selected");
    });

    it(`GIVEN existing option set is opened WHEN 'Option 3' checkbox has been checked THEN the content becomes invalid`, async () => {
        let contentWizard = new ContentWizard();
        let multiSelectionOptionSet = new MultiSelectionOptionSet();
        // 1. Open existing Option Set content:
        await studioUtils.selectAndOpenContentInWizard(OPTION_SET_NAME);
        // 2. Click on Option 3 checkbox:
        await multiSelectionOptionSet.clickOnOption('Option 3');
        let isInvalid = await contentWizard.isContentInvalid();
        assert.ok(isInvalid, 'Option Set content should be invalid because required image is not selected');
        // 3. Verify  that 'Option 4' becomes disabled, because max selection is 3 -  min: 1 max: 3
        await multiSelectionOptionSet.waitForOptionCheckboxDisabled('Option 4');
    });

    it(`GIVEN 'Option 3' checkbox has been clicked WHEN a text has been insert in htmlArea THEN MultiSelectionItemSubLabel should be updated`, async () => {
        let htmlAreaForm = new HtmlAreaForm();
        let multiSelectionOptionSet = new MultiSelectionOptionSet();
        // 1. Open existing Option Set content:
        await studioUtils.selectAndOpenContentInWizard(OPTION_SET_NAME);
        // 2. Click on 'Option 3' checkbox:
        await multiSelectionOptionSet.clickOnOption('Option 3');
        // 3. Type the text in HtmlArea
        await htmlAreaForm.typeTextInHtmlArea('Hello World!');
        // 4. Verify that the subtitle is dynamically updated:
        let subtitle = await multiSelectionOptionSet.getMultiSelectionItemSubLabel();
        assert.equal(subtitle, 'Hello World!', 'Expected subtitle should be displayed');
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
