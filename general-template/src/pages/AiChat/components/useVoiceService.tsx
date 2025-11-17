import { useEffect, useState } from 'react';
import { voiceService, type VoiceState } from '../../../services/voice';

const useVoiceService = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({ isReading: false, currentReadingMsgId: null, isLoading: false, loadingMsgId: null });

  const readAloudMessage = async (msgId: string, content: string) => {
    await voiceService.readMessage(msgId, content);
  };

  const stopReading = () => {
    voiceService.stopReading();
  };

  useEffect(() => {
    voiceService.setCallbacks({
      onStateChange: (state) => setVoiceState(state),
      onLoadStart: () => {},
      onCanPlay: () => {},
      onEnded: () => {},
      onError: () => {},
      onAbort: () => {},
    });
    return () => {
      voiceService.destroy();
    };
  }, []);

  return { voiceState, readAloudMessage, stopReading };
};

export default useVoiceService;