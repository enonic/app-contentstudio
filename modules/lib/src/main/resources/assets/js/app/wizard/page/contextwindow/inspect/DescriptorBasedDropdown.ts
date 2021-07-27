import {Option} from 'lib-admin-ui/ui/selector/Option';
import {RichDropdown} from 'lib-admin-ui/ui/selector/dropdown/RichDropdown';
import {Descriptor} from '../../../../page/Descriptor';
import {DescriptorKey} from '../../../../page/DescriptorKey';

export class DescriptorBasedDropdown
    extends RichDropdown<Descriptor> {

    protected createOption(descriptor: Descriptor): Option<Descriptor> {
        let indices: string[] = [];
        indices.push(descriptor.getDisplayName());
        indices.push(descriptor.getName().toString());

        return Option.create<Descriptor>()
                .setValue(descriptor.getKey().toString())
                .setDisplayValue(descriptor)
                .setIndices(indices)
                .build();
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

    getDescriptor(descriptorKey: DescriptorKey): Descriptor {
        if (descriptorKey) {
            let option = this.getOptionByValue(descriptorKey.toString());
            if (option) {
                return option.getDisplayValue();
            }
        }
        return null;
    }
}
