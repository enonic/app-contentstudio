// app/event/registry.ts
import {defineEvent} from '.';
import {EmulatorDevice} from '../../../../app/view/context/widget/emulator/EmulatorDevice';

const EmulatedDeviceEvent = defineEvent<EmulatorDevice>('emulated');

export {EmulatedDeviceEvent};
