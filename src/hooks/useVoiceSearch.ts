
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface UseVoiceSearchProps {
  onTranscript: (transcript: string) => void;
}

export const useVoiceSearch = ({ onTranscript }: UseVoiceSearchProps) => {
  const [isListening, setIsListening] = useState(false);

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not supported",
        description: "Voice search is not supported in your browser",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    setIsListening(true);
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      onTranscript(transcript);
    };
    
    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Error",
        description: "Could not recognize speech",
        variant: "destructive",
        duration: 3000
      });
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  return {
    isListening,
    startSpeechRecognition
  };
};
