import {ReactElement} from 'react';
import {PageMode} from '../../../../app/page/PageMode';
import {Cog, FileCog, LucideIcon, LucideProps, Wand} from 'lucide-react';

const TEMPLATE_ICON_MAP = new Map<PageMode, LucideIcon>([
    [PageMode.AUTOMATIC, Wand],
    [PageMode.FORCED_TEMPLATE, FileCog],
    [PageMode.FORCED_CONTROLLER, Cog],
]);

type Props = LucideProps & {
    pageMode: PageMode;
};

export function TemplateIcon({pageMode, ...props}: Props): ReactElement {
    const Icon = TEMPLATE_ICON_MAP.get(pageMode);

    if (Icon) {
        return <Icon {...props} />;
    }

    return undefined;
}
