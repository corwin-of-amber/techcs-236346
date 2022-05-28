<template>
    <div class="split-panes">
        <div class="pane pane--device" tabindex="0" @keydown="onKey" @keyup="unKey">
            <canvas ref="crt" id="crt" width="256" height="256"></canvas>
            <device-toolbar :ready="ready" :started="started" :ckey="ckey"
                @start="device?.start()" @stop="device?.stop()"/>
            <log ref="log" :entries="logEntries"></log>
        </div>
        <div class="pane pane--editor expand">
            <editor-toolbar @run="$emit('run')"/>
            <tabs ref="tabs">
                <tab v-for="tab in tabs" :key="tab" :name="tab">
                    <editor :ref="el => registerEditor(tab, el)"/>
                </tab>
            </tabs>
        </div>
    </div>
</template>

<style scoped>
.split-panes {
    display: flex;
    height: 100%;
}
.split-panes > .pane {
    height: 100%;
    position: relative;
}
.split-panes > .pane.expand {
    flex-grow: 1;
    overflow: hidden;
}

#editor-toolbar {
    position: absolute;
    left: 0;
    top: 0;
}

@import './tabs.css';
</style>

<script>
import { Tabs, Tab } from 'vue3-tabs-component';
import EditorToolbar from './toolbars/editor-toolbar.vue';
import DeviceToolbar from './toolbars/device-toolbar.vue';
import Editor from './editor.vue';
import Log from './log.vue';

import './tabs.css'; /** @oops Kremlin ignores `@import` in <style> tags */

const KEYS = {
    'ArrowRight': '→', 'ArrowLeft': '←',
    'ArrowUp': '↑', 'ArrowDown': '↓'
};

export default {
    data: () => ({ready: true, started: false, ckey: undefined, tabs: [], logEntries: []}),
    created() {
        this.device = null; // need to be initialized from class
        this.load();
    },
    methods: {
        registerEditor(name, el) {
            this.editors ??= new Map;
            if (el) this.editors.set(name, el);
            else    this.editors.delete(name);
        },
        async open(name, resource, opts = {focus: undefined, at: 'end', override: false}) {
            opts.focus ??= this.tabs.length == 0;
            opts.at ??= 'end';
            if (!this.editors?.get(name)) {
                this.tabs.push(name);
                await Promise.resolve();  // allow editor to get created
                if (opts.at === 'start')
                    this.$refs.tabs.tabs.unshift(this.$refs.tabs.tabs.pop());
            }
            if (opts.focus)
                this.$refs.tabs.selectTab('#' + name);
            if (!opts.override)
                resource = this.stored.get(name) ?? resource;
            this.editors.get(name).open(resource);
        },
        getSource(name = this.currentTab()) {
            return this.editors.get(name)?.get() ?? '';
        },
        currentTab() {
            var h = this.$refs.tabs.activeTabHash;
            return h && h.replace(/^#/, '');
        },
        log(level, text) {
            text ?? (text = level, level = 'info');
            this.logEntries.push({timestamp: new Date(), text, level});
            this.$refs.log.scrollToBottom();
        },
        clearLog() {
            this.logEntries = [];
        },
        load() {
            this.stored = new Map(JSON.parse(localStorage['editors'] || '[]'));
        },
        persist() {
            localStorage['editors'] = JSON.stringify(
                [...this.editors.entries()].map(([k, v]) => [k, v.get()])
            );
        },
        onKey(ev) {
            var symbol = KEYS[ev.key];
            if (symbol)
                this.ckey = {value: symbol, down: true};
            this.device.keyboard?.putc(ev);
        },
        unKey() {
            var ckey = this.ckey;
            if (ckey) {
                ckey.down = false;
                setTimeout(() => this.ckey === ckey &&
                                 (this.ckey = undefined), 1000);
            }
        }
    },
    components: { Tabs, Tab, EditorToolbar, DeviceToolbar, Editor, Log }
}
</script>
