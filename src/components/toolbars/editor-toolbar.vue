<template>
    <div id="editor-toolbar" class="toolbar">
        <button name="run" :title="`Run (${accel('^Enter')})`" @click="action">
            <svg viewBox="0 0 15 20" height="16"><path d="M0 19 L14 10 L0 1 Z"/></svg>
        </button>
    </div>  
</template>

<style scoped>
.toolbar {
    display: flex;
    background: #eee;
    padding-left: .3em;
}
button {
    border: none;
    height: 24px;
    line-height: 0;
}
button:hover { background: #ddd; }
button:active { background: #aaa; }
*[name=run] path {
    fill: green;
}
</style>

<script>
const mac = /(macintosh|macintel|macppc|mac68k|macos)/i.test(navigator.userAgent);

export default {
    props: ['ready', 'started'],
    methods: {
        action(ev) {
            this.$emit(ev.target.closest('[name]').name);
        },
        accel(k) {
            return k.replace('^', mac ? '⌘' : '^').replace('Enter', '⏎')
        }
    }
}
</script>
