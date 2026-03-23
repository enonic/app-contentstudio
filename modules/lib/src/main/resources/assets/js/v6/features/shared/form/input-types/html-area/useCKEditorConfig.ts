/*global CKEDITOR*/

import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {useEffect, useMemo, useState} from 'react';
import {ContentResourceRequest} from '../../../../../../app/resource/ContentResourceRequest';
import {StyleHelper} from '../../../../../../app/inputtype/ui/text/styles/StyleHelper';
import {Styles} from '../../../../../../app/inputtype/ui/text/styles/Styles';
import {StylesRequest} from '../../../../../../app/inputtype/ui/text/styles/StylesRequest';
import {UrlHelper} from '../../../../../../app/util/UrlHelper';
import type {HtmlAreaConfig} from './HtmlAreaConfig';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import type {Project} from '../../../../../../app/settings/data/project/Project';
import {getEarlyEditorEventHandlers} from './setupEditor';

type UseCKEditorConfigParams = {
    config: HtmlAreaConfig;
    editorId: string;
    assetsUri: string;
    contentSummary: ContentSummary | undefined;
    project: Readonly<Project> | undefined;
    editableSourceCode: boolean;
};

type UseCKEditorConfigResult = {
    editorConfig: CKEDITOR.config | undefined;
};

const DEFAULT_TOOLS: string[][] = [
    ['Styles', 'Bold', 'Italic', 'Underline'],
    ['JustifyBlock', 'JustifyLeft', 'JustifyCenter', 'JustifyRight'],
    ['BulletedList', 'NumberedList', 'Outdent', 'Indent'],
    ['FindAndReplace', 'SpecialChar', 'Anchor', 'Image', 'Macro', 'Link', 'Unlink'],
    ['Table'], ['PasteModeSwitcher'],
];

function isDefaultTool(tools: string[][], tool: string): boolean {
    return tools.some((group) => group.includes(tool));
}

function getAllowedHeadings(allowedHeadings: string | undefined): string[] {
    if (allowedHeadings) return allowedHeadings.trim().replace(/  +/g, ' ').replace(/ /g, ';').split(';');

    return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
}

function getExtraSpecialChars(): (string | [string, string])[] {
    return [
        ['&alpha;', 'alpha'], ['&beta;', 'beta'], ['&gamma;', 'gamma'],
        ['&delta;', 'delta'], ['&epsilon;', 'epsilon'], ['&zeta;', 'zeta'],
        ['&eta;', 'eta'], ['&theta;', 'theta'], ['&iota;', 'iota'],
        ['&kappa;', 'kappa'], ['&lambda;', 'lambda'], ['&mu;', 'mu'],
        ['&nu;', 'nu'], ['&xi;', 'xi'], ['&omicron;', 'omicron'],
        ['&pi;', 'pi'], ['&rho;', 'rho'], ['&sigma;', 'sigma'],
        ['&tau;', 'tau'], ['&upsilon;', 'upsilon'], ['&phi;', 'phi'],
        ['&chi;', 'chi'], ['&psi;', 'psi'], ['&omega;', 'omega'],
        ['(_)', i18n('text.htmlEditor.specialchars.nbsp')],
        ['(-)', i18n('text.htmlEditor.specialchars.shy')],
    ];
}

function getUploadUrl(project: Readonly<Project> | undefined): string {
    return UrlHelper.getCmsRestUri(
        `${UrlHelper.getCMSPathForContentRoot(project)}/${ContentResourceRequest.CONTENT_PATH}/createMedia`);
}

function buildToolbar(inputConfig: HtmlAreaConfig, editableSourceCode: boolean): {tools: string[][], disabledTools: string[], enabledTools: string[]} {
    const tools = DEFAULT_TOOLS.map((group) => [...group]);

    let disabledTools = [...(inputConfig.disabledTools || [])];
    let enabledTools = [...(inputConfig.enabledTools || [])];

    const isEverythingDisabled = disabledTools.length === 1 && disabledTools[0] === '*';

    // Process disabled tools
    if (disabledTools.length > 0) {
        disabledTools = disabledTools.map((tool) => tool.replace('Format', 'Styles'));

        if (isEverythingDisabled) {
            tools.length = 0;
            tools.push(['Bold', 'Italic', 'Underline']);
        }
    }

    // Process enabled tools
    if (enabledTools.length > 0) {
        enabledTools = enabledTools
            .map((tool) => tool === 'Format' ? 'Styles' : tool.replace(/\|/g, '-'))
            .filter((tool) => !isDefaultTool(tools, tool));
    }

    // Add source and fullscreen tools
    if (editableSourceCode && !enabledTools.includes('Sourcedialog')) {
        enabledTools.push('Sourcedialog');
    }
    if (!enabledTools.includes('Fullscreen')) {
        enabledTools.push('Fullscreen');
    }

    // Add Strike/Superscript/Subscript to first group, others to new group
    const toolsToAdd: string[] = [];
    for (const tool of enabledTools) {
        if (tool === 'Strike' || tool === 'Superscript' || tool === 'Subscript') {
            tools[0].push(tool);
        } else {
            toolsToAdd.push(tool);
        }
    }
    tools.push(toolsToAdd);

    return {tools, disabledTools, enabledTools};
}

function initCustomStyleSet(editorId: string, allowedHeadings: string | undefined, disabledTools: string[]): string {
    const customStyleSetID = `custom-${editorId}`;

    if (CKEDITOR.stylesSet.get(customStyleSetID)) return customStyleSetID;

    const isEverythingDisabled = disabledTools.length === 1 && disabledTools[0] === '*';
    const isToolDisabled = (tool: string) => isEverythingDisabled || disabledTools.includes(tool);

    const customStyleSet: {name: string; element: string}[] = [];
    customStyleSet.push({name: i18n('text.htmlEditor.styles.p'), element: 'p'});

    for (const heading of getAllowedHeadings(allowedHeadings)) {
        customStyleSet.push({name: i18n('text.htmlEditor.styles.heading', heading.charAt(1)), element: heading});
    }

    customStyleSet.push({name: i18n('text.htmlEditor.styles.div'), element: 'div'});
    customStyleSet.push({name: i18n('text.htmlEditor.styles.pre'), element: 'pre'});

    if (!isToolDisabled('Code')) {
        customStyleSet.push({name: i18n('text.htmlEditor.styles.code'), element: 'code'});
    }

    CKEDITOR.stylesSet.add(customStyleSetID, customStyleSet as unknown);

    return customStyleSetID;
}

function buildConfig(params: UseCKEditorConfigParams, cssPaths: string[]): CKEDITOR.config {
    const {tools, disabledTools} = buildToolbar(params.config, params.editableSourceCode);

    const styleSetId = initCustomStyleSet(params.editorId, params.config.allowedHeadings, disabledTools);

    const contentsCss = [params.assetsUri + '/styles/html-editor.css', ...cssPaths];

    const config: CKEDITOR.config = {
        contentsCss,
        toolbar: tools,
        forcePasteAsPlainText: false,
        entities: false,
        title: '',
        keystrokes: [
            [CKEDITOR.CTRL + 76, null], // disable default Link keystroke to remove its wrong tooltip
        ],
        removePlugins: 'resize,image',
        removeButtons: disabledTools?.join(),
        extraPlugins: 'macro,image2,pasteModeSwitcher,nbsp,colordialog,findAndReplace,language',
        extraAllowedContent: 'strong em u code address dl dt dd blockquote span(!shy);*(*);td{*};*[data-*]',
        stylesSet: styleSetId,
        image2_disableResizer: true,
        image2_captionedClass: 'captioned',
        image2_alignClasses: [
            StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS,
            StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS,
            StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS,
            StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS,
        ],
        disallowedContent: 'img[width,height]; table[*]{*}',
        uploadUrl: getUploadUrl(params.project),
        disableNativeSpellChecker: false,
        specialChars: (CKEDITOR.config.specialChars || []).concat(getExtraSpecialChars()),
        protectedSource: (CKEDITOR.config.protectedSource || []).concat([/&shy;/g]),
        language_list: [
            'ca:Català', 'da:Dansk', 'de:Deutsch', 'en:English',
            'es:Español', 'fr:Français', 'fo:Føroyskt', 'it:Italiano',
            'nb:Norsk bokmål', 'no:Norsk', 'pl:Polski', 'pt:Português',
            'ru:Русский', 'sv:Svenska',
        ],
    };

    const contentLang = params.contentSummary?.getLanguage();
    if (contentLang && Locale.supportsRtl(contentLang)) {
        config.contentsLangDirection = 'rtl';
    }

    config['qtRows'] = 10;
    config['qtColumns'] = 10;
    config['qtWidth'] = '100%';

    config.on = getEarlyEditorEventHandlers();

    return config;
}

export function useCKEditorConfig(params: UseCKEditorConfigParams): UseCKEditorConfigResult {
    const {config, editorId, assetsUri, contentSummary, project, editableSourceCode} = params;

    // Async: fetch custom styles CSS paths (depends only on content).
    const [cssPaths, setCssPaths] = useState<string[] | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        if (!contentSummary) {
            setCssPaths([]);
            return;
        }

        new StylesRequest(contentSummary.getId()).sendAndParse()
            .then(() => {
                if (!cancelled) {
                    setCssPaths(Styles.getCssPaths(contentSummary.getId()));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCssPaths([]);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [contentSummary]);

    // Sync: build config immediately when all inputs are available.
    // useMemo ensures the config updates in the same render when
    // editableSourceCode or other params change — no stale config.
    const editorConfig = useMemo(() => {
        if (cssPaths === undefined) return undefined;

        return buildConfig(
            {config, editorId, assetsUri, contentSummary, project, editableSourceCode},
            cssPaths,
        );
    }, [config, editorId, assetsUri, contentSummary, project, editableSourceCode, cssPaths]);

    return {editorConfig};
}
