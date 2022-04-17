<template>
    <div ref="content" class="log">
        <table>
            <tr class="log--entry" v-for="entry,$i in entries"
                :class="entry.level" :key="$i">
                <th class="timestamp">{{formatTime(entry.timestamp)}}</th>
                <td>{{entry.text}}</td>
            </tr>
        </table>
    </div>
</template>

<style scoped>
tr.log--entry th,
tr.log--entry td {
    vertical-align: top;
}
</style>

<script>
import strftime from 'strftime';

export default {
    props: ['entries'],
    methods: {
        formatTime(timestamp) {
            return strftime('%H:%M:%S.%L', timestamp);
        },
        scrollToBottom() {
            requestAnimationFrame(() =>
                this.$refs.content.scrollTop += 1e6);
        }
    }
}
</script>