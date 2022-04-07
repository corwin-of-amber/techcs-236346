import { DeviceEmulator } from '../device';

export interface App {
    started: boolean
    device: DeviceEmulator

    open(name: string, resource: any): Promise<void>
    getSource(name: string): string
}