<template>
    <div v-once ref="container" class="editor-container">
    </div>
</template>

<script>
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from '@codemirror/basic-setup';

export default {
    created() {
        this.config = {
            state: {
                extensions: [basicSetup]
            }
        };
    },
    mounted() {
        this.state = this.newState("");
        this.view = new EditorView({
            state: this.state,
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
            this.state = this.newState(resource);
            this.view.setState(this.state);
        }
    }
}
</script>
