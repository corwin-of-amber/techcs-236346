<template>
    <div>
        <canvas ref="crt" id="crt" width="256" height="256"></canvas>
        <toolbar :ready="ready" :started="started"
            @start="device?.start()" @stop="device?.stop()"/>
    </div>
</template>

<script>
import Toolbar from './toolbar.vue';


export default {
    data: () => ({ready: true, started: false}),
    mounted() {
        this.device = null; // need to be initialized from class
    },
    components: { Toolbar }
}
</script>
