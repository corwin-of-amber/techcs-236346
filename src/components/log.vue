<template>
    <div class="log">
        <table>
            <tr class="log--entry" v-for="entry,$i in entries" :key="$i">
                <th class="timestamp">{{formatTime(entry.timestamp)}}</th>
                <td>{{entry.text}}</td>
            </tr>
        </table>
    </div>
</template>

<script>
import strftime from 'strftime';

export default {
    props: ['entries'],
    methods: {
        formatTime(timestamp) {
            return strftime('%H:%M:%S.%L', timestamp);
        }
    }
}
</script>