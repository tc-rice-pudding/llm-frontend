<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { Recognizer } from '../lib/voice';

const emit = defineEmits(['sendMessage']);

const message = ref('');
const buttonDisabled = ref(false);
const isRecording = ref(false);
const recognizer = ref<Recognizer | null>(null);

// 初始化语音识别器
const initRecognizer = () => {
  if (!recognizer.value) {
    recognizer.value = new Recognizer();
    recognizer.value.onAudioTranscription = (transcription) => {
      if (transcription.text) {
        message.value = transcription.text;
      }
    };
  }
};

// 开始录音
const startRecording = async () => {
  initRecognizer();
  await recognizer.value?.start();
  isRecording.value = true;
};

// 停止录音
const stopRecording = async () => {
  if(!isRecording.value) {
    return;
  }
  isRecording.value = false;
  setTimeout(() => {
    recognizer.value?.stop();
  }, 1000);
};

// 处理语音按钮按下事件
const handleVoiceButtonDown = () => {
  startRecording();
};

// 处理语音按钮释放事件
const handleVoiceButtonUp = () => {
  stopRecording();
};

const handleSendMessage = () => {
  if (message.value.trim()) {
    buttonDisabled.value = true;
    emit('sendMessage', message.value, buttonDisabled);
    message.value = '';
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+Enter 发送消息
  if (event.ctrlKey && event.key === 'Enter') {
    handleSendMessage();
  }
};

// 组件卸载时销毁语音识别器
onUnmounted(() => {
  recognizer.value?.destroy();
});
</script>

<template>
  <div class="message-input-container">
    <textarea 
      v-model="message" 
      class="message-input" 
      placeholder="请输入您的回答..."
      @keydown="handleKeydown"
    ></textarea>
    <div class="button-container">
      <button 
        class="voice-button" 
        @mousedown="handleVoiceButtonDown" 
        @mouseup="handleVoiceButtonUp"
        @mouseleave="handleVoiceButtonUp"
        :class="{ 'recording': isRecording }"
        title="长按进行语音输入"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </button>
      <button class="send-button" @click="handleSendMessage" :disabled="buttonDisabled">发送</button>
    </div>
  </div>
</template>

<style scoped>
.message-input-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background-color: #fff;
  border-top: 1px solid #eee;
  border-radius: 0 0 8px 8px;
}

.message-input {
  min-height: 80px;
  max-height: 120px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #646cff;
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
}

.button-container {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.voice-button {
  padding: 8px;
  background-color: #f5f5f5;
  color: #646cff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-button:hover {
  background-color: #eaeaea;
}

.voice-button.recording {
  background-color: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 77, 79, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
  }
}

.send-button {
  padding: 8px 16px;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: #535bf2;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>