<template>
    <div id="device-toolbar" class="toolbar">
        <button name="start" :disabled="!(ready && !started)" @click="action">Start</button>
        <button name="stop" :disabled="!(ready && started)" @click="action">Stop</button>
        <kbd v-if="!!ckey" :class="{'kbd-down': ckey.down}">{{ckey.value}}</kbd>
    </div>  
</template>

<style scoped>
kbd { float: right; }
</style>

<script>
import '../kbd.css';

export default {
    props: ['ready', 'started', 'ckey'],
    methods: {
        action(ev) {
            this.$emit(ev.target.name);
        }
    }
}
</script>
