import { BrowserHelper } from '@enonic/lib-admin-ui/BrowserHelper';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';

const isApple = BrowserHelper.isOSX() || BrowserHelper.isIOS();
const MODIFIER_KEY = isApple ? '⌘' : 'Ctrl';
const PROJECT_DAG_SHORTCUTS_NAME = 'ProjectDagShortcuts';

export const ProjectDagShortcuts = (): ReactElement => {
    const zoomLabel = useI18n('settings.statistics.projects.graph.hint.zoom');
    const scrollKey = useI18n('settings.statistics.projects.graph.hint.scroll');
    const fitLabel = useI18n('settings.statistics.projects.graph.fit');
    const resetLabel = useI18n('settings.statistics.projects.graph.reset');

    return (
        <div
            data-component={PROJECT_DAG_SHORTCUTS_NAME}
            aria-hidden
            className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle opacity-0 transition-opacity select-none group-hover:opacity-100 group-focus-within:opacity-100"
        >
            <Hint keys={[MODIFIER_KEY, scrollKey]} label={zoomLabel} />
            <Hint keys={['+', '-']} label={zoomLabel} />
            <Hint keys={['F']} label={fitLabel} />
            <Hint keys={[MODIFIER_KEY, '0']} label={resetLabel} />
        </div>
    );
};

ProjectDagShortcuts.displayName = PROJECT_DAG_SHORTCUTS_NAME;

// *
// * Internal
// *
const Hint = ({ keys, label }: { keys: string[]; label: string }): ReactElement => {
    return (
        <span className="flex items-center gap-1">
            {keys.map((key) => (
                <kbd key={key} className="rounded border border-bdr-soft bg-surface-neutral px-1 font-mono text-[10px]">
                    {key}
                </kbd>
            ))}
            <span>{label}</span>
        </span>
    );
};
