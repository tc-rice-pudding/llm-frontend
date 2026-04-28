import Cookie from 'universal-cookie';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

async function getTokenOrRefresh() {
  const cookie = new Cookie();
  const speechToken = cookie.get('speech-token');

  console.log(speechToken, 'speechToken');

  if (speechToken === undefined || speechToken === 'undefined:undefined') {
    try {
      const res = await fetch('/api/voice-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const { data } = await res.json();

      // console.log(data);

      const token = data.token;
      const region = data.region;
      cookie.set('speech-token', `${region}:${token}`, {
        maxAge: 540,
        path: '/',
      });

      console.log('Token fetched from back-end: ' + token);
      return { authToken: token, region: region };
    } catch (err: any) {
      console.log(err);
      return { authToken: null, error: err.response.data };
    }
  } else {
    // console.log('Token fetched from cookie: ' + speechToken);
    const idx = speechToken.indexOf(':');
    return {
      authToken: speechToken.slice(idx + 1),
      region: speechToken.slice(0, idx),
    };
  }
}

export async function sttFromMic(onMessage: (text: string, delta: string, isClosed: boolean) => void) {
  const tokenObj = await getTokenOrRefresh();
  const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
  speechConfig.speechRecognitionLanguage = 'zh-CN';

  const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

  console.log('speak into your microphone...');

  let text = '';

  recognizer.recognizing = (s, e) => {
    // console.log(`RECOGNIZING: Text=${e.result.text}`);
    (recognizer as any).startRecord = true;
  };

  recognizer.recognized = (s, e) => {
    if (e.result.reason == speechsdk.ResultReason.RecognizedSpeech) {
      // console.log(`RECOGNIZED: Text=${e.result.text}`);
      text += e.result.text;
      onMessage(text, e.result.text, false);
    } else if (e.result.reason == speechsdk.ResultReason.NoMatch) {
      // console.log('NOMATCH: Speech could not be recognized.');
    }
  };

  recognizer.canceled = (s, e) => {
    console.log(`CANCELED: Reason=${e.reason}`);

    if (e.reason == speechsdk.CancellationReason.Error) {
      console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
      console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
      console.log('CANCELED: Did you set the speech resource key and region values?');
    }

    recognizer.stopContinuousRecognitionAsync();
  };

  recognizer.sessionStopped = (s, e) => {
    // console.log('\n    Session stopped event.');
    recognizer.stopContinuousRecognitionAsync();
    onMessage(text, '', true);
  };
  recognizer.startContinuousRecognitionAsync();

  return recognizer;
}
