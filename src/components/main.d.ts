import { DeviceEmulator } from '../device';

export interface App {
    started: boolean
    device: DeviceEmulator

    open(resource: any): void
}