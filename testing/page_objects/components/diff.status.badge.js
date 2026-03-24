/**
 * Created on 24.03.2026
 */
const Page = require('../page');

const xpath = {
    container: `//span[@data-component='DiffStatusBadge']`,
    publishStatus: `//span[1]`,
    statusDiffStatus: `//span[2]`,
    statusValidity: `//span[contains(@class,'truncate')]`,
    // SVG that carries the workflow state via aria-label (e.g. 'ready', 'in-progress').
    // The content-type icon has aria-hidden="true" and no aria-label, so [@aria-label] is sufficient to target only the status icon.
    workflowStateIcon: `//svg[@aria-label and not(@aria-hidden='true')]`,
};

// DiffStatusBadge component is used on widget and modal dialogs
class DiffStatusBadge extends Page {

    constructor(xpath) {
        super();
        this.parentContainer = xpath === undefined ? '' : xpath;
    }
    
    get publishStatus() {
        return this.parentContainer + xpath.container + xpath.publishStatus;
    }

    get statusDiffStatus() {
        return this.parentContainer + xpath.container + xpath.statusDiffStatus;
    }

    // Workflow and validation status are displayed in the same element, so we need to check both of them to get the full status info
    get statusValidity() {
        return this.parentContainer + xpath.container + xpath.statusValidity;
    }

    // Returns the aria-label of the workflow-state SVG icon, e.g. 'ready' or 'in-progress'.
    // Returns '' when the icon is absent (content has no workflow state overlay).
    async getWorkflowIconState() {
        try {
            const locator = this.parentContainer + xpath.workflowStateIcon;
            let parentElement = await this.findElements(this.parentContainer);
            let svgElement = await parentElement[0].$("svg[aria-label]");
            let value = await svgElement.getAttribute('aria-label');
            return value;
        } catch (e) {
            return '';
        }
    }

    async getStatusText() {
        await this.waitForElementDisplayed(this.publishStatus);
        const publishStatus = await this.getText(this.publishStatus);
        const diffStatusElements = await this.findElements(this.statusDiffStatus);
        const diffStatus = diffStatusElements.length > 0 ? await diffStatusElements[0].getText() : '';
        const validityElements = await this.findElements(this.statusValidity);
        const validity = validityElements.length > 0 ? await validityElements[0].getText() : '';
        return [publishStatus, diffStatus, validity].filter(t => t).join(' ');
    }
}

module.exports = DiffStatusBadge;
