<template>
    <div v-once ref="container" class="editor-container">
    </div>
</template>

<style scoped>
div :deep(.cm-lineNumbers .cm-gutterElement) {
    min-width: 3em !important;
}
</style>

<script>
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import setup from './editor-setup';

export default {
    props: ['name'],
    created() {
        this.config = {
            state: {
                extensions: [setup]
            }
        };
    },
    mounted() {
        var state = this.newState("");
        this.view = new EditorView({
            state,
            parent: this.$refs.container
        });
    },
    methods: {
        newState(text) {
            return EditorState.create({...this.config.state, doc: text});
        },
        open(resource) {
            if (typeof resource !== 'string')
                resource = JSON.stringify(resource, null, 2);
            this.view.setState(this.newState(resource));
        },
        get() {
            return this.view.state.doc.toString();
        }
    }
}
</script>
