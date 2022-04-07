<template>
    <div class="split-panes">
        <div class="pane pane--device">
            <canvas ref="crt" id="crt" width="256" height="256"></canvas>
            <toolbar :ready="ready" :started="started"
                @start="device?.start()" @stop="device?.stop()"/>
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
.pane--editor {
    display: flex;
    flex-direction: column;
}

@import './tabs.css';

.pane--editor .tabs-component,
.pane--editor :deep(.editor-container),
.pane--editor :deep(.cm-editor) {
    height: 100%;
}
</style>

<script>
import {Tabs, Tab} from 'vue3-tabs-component';
import Toolbar from './toolbar.vue';
import Editor from './editor.vue';

import './tabs.css'; /** @oops Kremlin ignores `@import` in <style> tags */


export default {
    data: () => ({ready: true, started: false, tabs: []}),
    mounted() {
        this.device = null; // need to be initialized from class
    },
    methods: {
        registerEditor(name, el) {
            this.editors ??= new Map;
            if (el) this.editors.set(name, el);
            else    this.editors.delete(name);
        },
        async open(name, resource, focus = (this.tabs.length == 0)) {
            this.tabs.push(name);
            await Promise.resolve();  // let editor get created
            if (focus)
                this.$refs.tabs.selectTab('#' + name);
            this.editors.get(name).open(resource);
        },
        getSource(name) {
            var ed = this.editors.get(name);
            return ed?.state.doc.toString() ?? '';
        }
    },
    components: { Tabs, Tab, Toolbar, Editor }
}
</script>
