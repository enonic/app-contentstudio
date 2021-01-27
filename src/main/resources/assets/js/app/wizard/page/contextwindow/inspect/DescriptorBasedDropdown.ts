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

        return Option.create<DESCRIPTOR>()
                .setValue(descriptor.getKey().toString())
                .setDisplayValue(descriptor)
                .setIndices(indices)
                .build();
    }

    setDescriptor(descriptor: Descriptor) {
        this.resetActiveSelection();
        this.resetSelected();

        if (descriptor) {
            let option = this.getOptionByValue(descriptor.getKey().toString());
            if (option) {
                this.selectOption(option, true);
            }
        } else {
            this.reset();
            this.hideDropdown();
        }
    }

    getDescriptor(descriptorKey: DescriptorKey): DESCRIPTOR {
        if (descriptorKey) {
            let option = this.getOptionByValue(descriptorKey.toString());
            if (option) {
                return option.getDisplayValue();
            }
        }
        return null;
    }
}
