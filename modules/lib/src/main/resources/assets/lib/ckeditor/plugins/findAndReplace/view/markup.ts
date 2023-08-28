import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export enum Classes {
    SWITCH = 'fnr-switch',
    FIND = 'fnr-find',
    REPLACE = 'fnr-replace',
    MATCH_CASE = 'fnr-matchCase',
    WHOLE_WORDS = 'fnr-wholeWords',
    PREV = 'fnr-prev',
    NEXT = 'fnr-next',
    ACTION_REPLACE = 'fnr-actionReplace',
    ACTION_REPLACE_ALL = 'fnr-actionReplaceAll',
    COUNTER = 'fnr-counter',
}

export default `
<div class="fnr-wrapper">
    <div class="fnr-group fnr-modeGroup">
        <button class="${Classes.SWITCH}" title="${i18n('dialog.search.switch')}">
            <span class="fnr-switchArrow">&#10095;</span>
        </button>
    </div>
    <div class="fnr-group fnr-findGroup">
        <input type="text" class="fnr-input ${Classes.FIND}" placeholder="${i18n('dialog.search.find.tooltip')}"/>
        <div class="fnr-group fnr-togglersGroup">
            <label class="fnr-toggler" title="${i18n('dialog.search.matchcase')}">
                <input type="checkbox" class="fnr-checkbox ${Classes.MATCH_CASE}"/>
                <span>Aa</span>
            </label>
            <label class="fnr-toggler" title="${i18n('dialog.search.wholewords')}">
                <input type="checkbox" class="fnr-checkbox ${Classes.WHOLE_WORDS}"/>
                <span>W</span>
            </label>
        </div>
    </div>
    <button class="fnr-arrow ${Classes.PREV}" title="${i18n('dialog.search.find.previous')}"></button>
    <button class="fnr-arrow ${Classes.NEXT}" title="${i18n('dialog.search.find.next')}"></button>
    
    <div class="fnr-group fnr-replaceGroup">
        <input type="text" class="fnr-input ${Classes.REPLACE}" placeholder="${i18n('dialog.search.replace.tooltip')}"/>
        <p class="${Classes.COUNTER}"></p>
        <button class="fnr-action ${Classes.ACTION_REPLACE}">${i18n('dialog.search.replace')}</button>
        <button class="fnr-action ${Classes.ACTION_REPLACE_ALL}">${i18n('dialog.search.replaceAll')}</button>
    </div>
</div>
`;

export const HIGHLIGHT_CLASS = 'cke__highlighted_term';
export const SELECTION_CLASS = 'cke__selected_term';
