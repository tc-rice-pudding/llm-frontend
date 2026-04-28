<script setup lang="ts">
import { ref, onMounted } from "vue";

const selectedDate = ref('');

const props = defineProps({
    value: {
        type: String,
        default: '',
    },
});

onMounted(() => {
    selectedDate.value = props.value;
});

const emit = defineEmits(["dateUpdate"]);

const handleDateChange = () => {
    emit("dateUpdate", selectedDate.value);
};
</script>
<template>
    <div>
        <label for="date">选择日期：</label>
        <input type="date" id="date" v-model="selectedDate" @change="handleDateChange" />
    </div>
</template>