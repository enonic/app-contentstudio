import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {IconButton, Listbox} from '@enonic/ui';
import {useState} from 'react';
import {WidgetView} from '../../../../../app/view/context/WidgetView';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {WidgetIcon} from './details/utils';

type Props = {
    widgetViews?: WidgetView[];
    selectedWidgetView?: WidgetView;
};

const WidgetsDropdown = ({widgetViews = [], selectedWidgetView = undefined}: Props) => {
    const [selection, setSelection] = useState<readonly string[]>([]);
    const [toggleDropdown, setToggleDropdown] = useState<boolean>(false);

    return (
        <div className="h-15 bg-surface-neutral flex items-center justify-between px-5 border-b border-bdr-soft relative shrink-0">
            <div className="flex items-center gap-2.5">
                <WidgetIcon widgetView={selectedWidgetView} />
                <span className="text-sm font-semibold">{selectedWidgetView?.getWidgetName() || ''}</span>
            </div>

            <IconButton
                icon={toggleDropdown ? ChevronUp : ChevronDown}
                onClick={() => setToggleDropdown(!toggleDropdown)}
            />

            {toggleDropdown && (
                <Listbox
                    selectionMode="single"
                    selection={selection}
                    onSelectionChange={(selection) => {
                        setSelection(selection);
                        setToggleDropdown(false);
                        widgetViews.find((widgetView) => widgetView.getWidgetName() === selection[0])?.setActive();
                    }}
                >
                    <Listbox.Content className="absolute top-15 left-0 w-full z-10 h-fit bg-surface-neutral border-b border-bdr-soft">
                        {widgetViews.map((widgetView) => (
                            <Listbox.Item
                                className="group flex items-center gap-4"
                                key={widgetView.getWidgetName()}
                                value={widgetView.getWidgetName()}
                            >
                                <WidgetIcon widgetView={widgetView} />
                                <div className="flex flex-col items-start justify-center">
                                    <span className="text-xs font-semibold">{widgetView.getWidgetName()}</span>
                                    <span className="text-xs text-subtle group-data-[tone=inverse]:text-alt">
                                        {widgetView.getWidgetDescription()}
                                    </span>
                                </div>
                            </Listbox.Item>
                        ))}
                    </Listbox.Content>
                </Listbox>
            )}
        </div>
    );
};

WidgetsDropdown.displayName = 'WidgetsDropdown';

export default class WidgetsDropdownElement extends LegacyElement<typeof WidgetsDropdown, Props> {
    constructor(props: Props) {
        super(props, WidgetsDropdown);
    }

    // Backwards compatibility

    updateState(widgetView: WidgetView): void {
        this.props.setKey('selectedWidgetView', widgetView);
    }

    updateWidgetsDropdown(widgetViews: WidgetView[], selectedView?: WidgetView): void {
        this.props.setKey('widgetViews', widgetViews);

        if (selectedView) {
            this.props.setKey('selectedWidgetView', selectedView);
        }
    }
}
