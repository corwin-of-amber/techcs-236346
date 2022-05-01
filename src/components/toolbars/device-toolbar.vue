<template>
    <div id="device-toolbar" class="toolbar">
        <button name="start" :disabled="!(ready && !started)" @click="action">Start</button>
        <button name="stop" :disabled="!(ready && started)" @click="action">Stop</button>
    </div>  
</template>

<style>

</style>

<script>
export default {
    props: ['ready', 'started'],
    methods: {
        action(ev) {
            this.$emit(ev.target.name);
        }
    }
}
</script>
