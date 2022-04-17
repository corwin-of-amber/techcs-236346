import { DeviceEmulator } from '../device';

export interface App {
    ready: boolean
    started: boolean
    device: DeviceEmulator

    open(name: string, resource: any, opts?: {focus?: boolean, at?: 'start' | 'end', override?: boolean}): Promise<void>
    getSource(name?: string): string
    currentTab(): string

    log(text: string): void
    log(level: 'info' | 'error' | 'phase', text: string): void
    clearLog(): void

    persist(): void
}