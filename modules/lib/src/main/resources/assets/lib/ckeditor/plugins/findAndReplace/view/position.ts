// Fix for panel position relative to the button
export function fixPanelPosition(id: string, panelEl: HTMLElement): void {
    const viewportWidth = CKEDITOR.document.getWindow().getViewPaneSize().width;
    const buttonPos = CKEDITOR.document.$.getElementById(id).getBoundingClientRect();
    const panelWidth = panelEl.offsetWidth || 344;

    if (buttonPos.x + panelWidth > viewportWidth) {
        panelEl.classList.add('fnr-panel_movedRight');
    } else {
        panelEl.classList.remove('fnr-panel_movedRight');
    }

    const topHeight = document.querySelector('.xp-page-editor-page-view .cke_top')?.clientHeight;
    if (topHeight) {
        panelEl.style.marginTop = `${topHeight}px`;
    }
}
