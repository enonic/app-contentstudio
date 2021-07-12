import {Option} from 'lib-admin-ui/ui/selector/Option';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {RichDropdown} from 'lib-admin-ui/ui/selector/dropdown/RichDropdown';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';

export class DescriptorBasedDropdown<DESCRIPTOR extends Descriptor>
    extends RichDropdown<DESCRIPTOR> {

    protected createOption(descriptor: DESCRIPTOR): Option<DESCRIPTOR> {
        let indices: string[] = [];
        indices.push(descriptor.getDisplayName());
        indices.push(descriptor.getName().toString());

        return <Option<DESCRIPTOR>>{
            value: descriptor.getKey().toString(),
            displayValue: descriptor,
            indices: indices
        };
    }

    setDescriptor(descriptor: Descriptor) {
        this.resetActiveSelection();
        this.resetSelected();

        if (descriptor) {
            const option: Option<Descriptor> = this.getOptionByValue(descriptor.getKey().toString()) ||
                                               this.createReadOnlyOption(descriptor);
            this.selectOption(option, true);
        } else {
            this.reset();
            this.hideDropdown();
        }
    }

    private createReadOnlyOption(descriptor: Descriptor): Option<Descriptor> {
        const readonlyOption: Option<Descriptor> = this.createOption(descriptor);
        readonlyOption.setReadOnly(true);
        return readonlyOption;
    }

    getDescriptor(descriptorKey: DescriptorKey): DESCRIPTOR {
        if (descriptorKey) {
            let option = this.getOptionByValue(descriptorKey.toString());
            if (option) {
                return option.displayValue;
            }
        }
        return null;
    }
}
