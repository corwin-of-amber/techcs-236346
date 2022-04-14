<template>
    <div class="split-panes">
        <div class="pane pane--device">
            <canvas ref="crt" id="crt" width="256" height="256"></canvas>
            <toolbar :ready="ready" :started="started"
                @start="device?.start()" @stop="device?.stop()"/>
            <log ref="log" :entries="logEntries"></log>
        </div>
        <div class="pane pane--editor expand">
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
}
.split-panes > .pane.expand {
    flex-grow: 1;
    overflow: hidden;
}

@import './tabs.css';
</style>

<script>
import { Tabs, Tab } from 'vue3-tabs-component';
import Toolbar from './toolbar.vue';
import Editor from './editor.vue';
import Log from './log.vue';

import './tabs.css'; /** @oops Kremlin ignores `@import` in <style> tags */


export default {
    data: () => ({ready: true, started: false, tabs: [], logEntries: []}),
    mounted() {
        this.device = null; // need to be initialized from class
    },
    methods: {
        registerEditor(name, el) {
            this.editors ??= new Map;
            if (el) this.editors.set(name, el);
            else    this.editors.delete(name);
        },
        async open(name, resource, opts = {focus: this.tabs.length == 0, at: 'end'}) {
            if (!this.editors?.get(name)) {
                this.tabs.push(name);
                await Promise.resolve();  // allow editor to get created
                if (opts.at === 'start')
                    this.$refs.tabs.tabs.unshift(this.$refs.tabs.tabs.pop());
            }
            if (opts.focus)
                this.$refs.tabs.selectTab('#' + name);
            this.editors.get(name).open(resource);
        },
        getSource(name = this.currentTab()) {
            return this.editors.get(name)?.get() ?? '';
        },
        currentTab() {
            var h = this.$refs.tabs.activeTabHash;
            return h && h.replace(/^#/, '');
        },
        log(text) {
            this.logEntries.push({timestamp: new Date(), text});
        }
    },
    components: { Tabs, Tab, Toolbar, Editor, Log }
}
</script>
