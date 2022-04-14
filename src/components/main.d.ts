import { DeviceEmulator } from '../device';

export interface App {
    ready: boolean
    started: boolean
    device: DeviceEmulator

    open(name: string, resource: any, opts?: {focus?: boolean, at?: 'start' | 'end'}): Promise<void>
    getSource(name?: string): string
    currentTab(): string

    log(text: string): void
}