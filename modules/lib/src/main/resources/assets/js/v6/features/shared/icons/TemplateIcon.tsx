import {ReactElement} from 'react';
import {PageMode} from '../../../../app/page/PageMode';
import {Cog, FileCog, LucideIcon, LucideProps, Wand} from 'lucide-react';

const TEMPLATE_ICON_MAP = new Map<PageMode, LucideIcon>([
    [PageMode.AUTOMATIC, Wand],
    [PageMode.FORCED_TEMPLATE, FileCog],
    [PageMode.FORCED_CONTROLLER, Cog],
]);

type TemplateIconProps = LucideProps & {
    pageMode: PageMode;
};

function getIcon(pageMode: PageMode): LucideIcon | null {
    return TEMPLATE_ICON_MAP.get(pageMode) ?? null;
}

export function TemplateIcon({pageMode, ...props}: TemplateIconProps): ReactElement {
    const Icon = getIcon(pageMode);

    if (!Icon) return null;

    return <Icon {...props} />;
}

TemplateIcon.displayName = 'TemplateIcon';
