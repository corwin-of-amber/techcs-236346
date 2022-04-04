<template>
    <div class="split-panes">
        <div class="pane pane--device">
            <canvas ref="crt" id="crt" width="256" height="256"></canvas>
            <toolbar :ready="ready" :started="started"
                @start="device?.start()" @stop="device?.stop()"/>
        </div>
        <div class="pane pane--editor expand">
            <editor ref="editor"/>
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
}
.pane--editor {
    display: flex;
    flex-direction: column;
}
</style>

<style>
.pane--editor > .editor-container {
    flex-basis: 0;
    flex-grow: 1;
    overflow: hidden;
}
.pane--editor .cm-editor {
    height: 100%;
}
</style>

<script>
import Toolbar from './toolbar.vue';
import Editor from './editor.vue';


export default {
    data: () => ({ready: true, started: false}),
    mounted() {
        this.device = null; // need to be initialized from class
    },
    methods: {
        open(resource) { this.$refs.editor.open(resource); },
        source() { return this.$refs.editor.state.doc.toString(); }
    },
    components: { Toolbar, Editor }
}
</script>
