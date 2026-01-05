import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Send, Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isVoice?: boolean;
}

interface ParsedIntent {
  action: 'plan_trip' | 'book_train' | 'book_flight' | 'book_bus' | 'navigate' | 'show_bookings' | 'check_pnr' | 'find_buddies' | 'show_tickets' | 'explore_posts' | 'unknown';
  params: {
    destination?: string;
    origin?: string;
    days?: number;
    budget?: string;
    page?: string;
    pnr?: string;
  };
}

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your TraviLink assistant. Try:\n• 'Plan a trip to Jaipur for 2 days'\n• 'Show my bookings'\n• 'Check PNR 1234567890'\n• 'Find travel buddies to Goa'\n• 'Book a train'",
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoReadAloud, setAutoReadAloud] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { isListening, transcript, startListening, stopListening, isSupported: speechSupported } = useSpeechRecognition();
  const { isSpeaking, speak, stop, isSupported: ttsSupported } = useTextToSpeech();

  // Update input with transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // When voice recording stops and we have transcript, auto-submit
  useEffect(() => {
    if (!isListening && transcript && transcript.trim()) {
      handleSubmit(transcript, true);
    }
  }, [isListening]);

  const parseIntent = (text: string): ParsedIntent => {
    const lowerText = text.toLowerCase();
    
    // Plan trip patterns
    const tripMatch = lowerText.match(/(?:plan|create|make|generate).*(?:trip|itinerary|travel).*(?:to|for)\s+([a-zA-Z\s]+?)(?:\s+for\s+(\d+)\s*days?)?/i);
    const destinationMatch = lowerText.match(/(?:to|for|visit)\s+([a-zA-Z\s]+?)(?:\s|$|for|from)/i);
    const daysMatch = lowerText.match(/(\d+)\s*days?/i);
    const budgetMatch = lowerText.match(/(low|budget|cheap|affordable|medium|moderate|high|luxury|premium)/i);
    const fromMatch = lowerText.match(/from\s+([a-zA-Z\s]+?)(?:\s+to|\s+for|$)/i);
    
    if (tripMatch || (destinationMatch && (lowerText.includes('plan') || lowerText.includes('trip') || lowerText.includes('itinerary')))) {
      const destination = tripMatch?.[1]?.trim() || destinationMatch?.[1]?.trim() || '';
      return {
        action: 'plan_trip',
        params: {
          destination: destination.replace(/\s*(for|from|on|in|with).*$/, '').trim(),
          origin: fromMatch?.[1]?.trim(),
          days: daysMatch ? parseInt(daysMatch[1]) : undefined,
          budget: budgetMatch ? (budgetMatch[1].match(/low|budget|cheap|affordable/) ? 'low' : 
                                 budgetMatch[1].match(/medium|moderate/) ? 'medium' : 'high') : undefined,
        },
      };
    }

    // Book train
    if (lowerText.includes('book') && lowerText.includes('train')) {
      return { action: 'book_train', params: {} };
    }

    // Book flight
    if (lowerText.includes('book') && lowerText.includes('flight')) {
      return { action: 'book_flight', params: {} };
    }

    // Book bus
    if (lowerText.includes('book') && lowerText.includes('bus')) {
      return { action: 'book_bus', params: {} };
    }

    // Show bookings
    if ((lowerText.includes('show') || lowerText.includes('view') || lowerText.includes('my')) && 
        (lowerText.includes('booking') || lowerText.includes('reservation'))) {
      return { action: 'show_bookings', params: {} };
    }

    // Show tickets
    if ((lowerText.includes('show') || lowerText.includes('view') || lowerText.includes('my')) && 
        lowerText.includes('ticket')) {
      return { action: 'show_tickets', params: {} };
    }

    // Check PNR
    const pnrMatch = lowerText.match(/(?:check|pnr|status)\s*(?:pnr)?\s*(\d{10})/i) || 
                     lowerText.match(/(\d{10})/);
    if (lowerText.includes('pnr') || lowerText.includes('status')) {
      return { action: 'check_pnr', params: { pnr: pnrMatch?.[1] } };
    }

    // Find travel buddies
    if ((lowerText.includes('find') || lowerText.includes('search')) && 
        (lowerText.includes('buddy') || lowerText.includes('buddies') || lowerText.includes('companion') || lowerText.includes('partner'))) {
      const buddyDestMatch = lowerText.match(/(?:to|for|going)\s+([a-zA-Z\s]+?)(?:\s|$)/i);
      return { action: 'find_buddies', params: { destination: buddyDestMatch?.[1]?.trim() } };
    }

    // Explore posts/feed
    if (lowerText.includes('explore') || lowerText.includes('feed') || lowerText.includes('posts')) {
      return { action: 'explore_posts', params: {} };
    }

    // Navigation patterns
    if (lowerText.includes('go to') || lowerText.includes('open') || lowerText.includes('navigate')) {
      if (lowerText.includes('home')) return { action: 'navigate', params: { page: '/' } };
      if (lowerText.includes('profile')) return { action: 'navigate', params: { page: '/profile' } };
      if (lowerText.includes('explore')) return { action: 'navigate', params: { page: '/explore' } };
      if (lowerText.includes('booking') || lowerText.includes('book')) return { action: 'navigate', params: { page: '/booking-hub' } };
      if (lowerText.includes('dashboard')) return { action: 'navigate', params: { page: '/dashboard' } };
      if (lowerText.includes('trip') || lowerText.includes('planner')) return { action: 'navigate', params: { page: '/planner' } };
      if (lowerText.includes('buddies') || lowerText.includes('travel buddy')) return { action: 'navigate', params: { page: '/travel-buddies' } };
      if (lowerText.includes('cart')) return { action: 'navigate', params: { page: '/cart' } };
      if (lowerText.includes('photo') || lowerText.includes('vault')) return { action: 'navigate', params: { page: '/photo-vault' } };
    }

    return { action: 'unknown', params: {} };
  };

  const executeIntent = async (intent: ParsedIntent, isVoiceCommand: boolean): Promise<string> => {
    switch (intent.action) {
      case 'plan_trip': {
        const { destination, origin, days, budget } = intent.params;
        
        // Build URL with query params
        const params = new URLSearchParams();
        if (destination) params.set('destination', destination);
        if (origin) params.set('origin', origin);
        if (days) params.set('days', days.toString());
        if (budget) params.set('budget', budget);
        params.set('autoSubmit', 'true');
        if (isVoiceCommand) params.set('readAloud', 'true');
        
        navigate(`/planner?${params.toString()}`);
        setIsOpen(false);
        
        return `I'm taking you to the trip planner to create a ${days ? `${days}-day` : ''} trip to ${destination || 'your destination'}${budget ? ` with a ${budget} budget` : ''}. The itinerary will be generated automatically!`;
      }

      case 'book_train':
        navigate('/booking-hub?tab=trains');
        setIsOpen(false);
        return "Taking you to the train booking section. You can search for trains there!";

      case 'book_flight':
        navigate('/booking-hub?tab=flights');
        setIsOpen(false);
        return "Taking you to the flight booking section. Happy travels!";

      case 'book_bus':
        navigate('/booking-hub?tab=bus');
        setIsOpen(false);
        return "Taking you to the bus booking section. Find your perfect ride!";

      case 'show_bookings':
        navigate('/profile?tab=bookings');
        setIsOpen(false);
        return "Opening your bookings. You can view all your upcoming and past reservations there!";

      case 'show_tickets':
        navigate('/my-tickets');
        setIsOpen(false);
        return "Opening your tickets. Here you can see all your booked tickets!";

      case 'check_pnr':
        if (intent.params.pnr) {
          navigate(`/trains/pnr-enquiry?pnr=${intent.params.pnr}`);
        } else {
          navigate('/trains/pnr-enquiry');
        }
        setIsOpen(false);
        return intent.params.pnr 
          ? `Checking PNR status for ${intent.params.pnr}. The status will be displayed shortly!`
          : "Opening PNR enquiry page. Enter your 10-digit PNR number to check status.";

      case 'find_buddies':
        if (intent.params.destination) {
          navigate(`/travel-buddies?destination=${encodeURIComponent(intent.params.destination)}`);
        } else {
          navigate('/travel-buddies');
        }
        setIsOpen(false);
        return intent.params.destination
          ? `Finding travel buddies heading to ${intent.params.destination}. Connect with fellow travelers!`
          : "Opening travel buddies page. Find companions for your next adventure!";

      case 'explore_posts':
        navigate('/');
        setIsOpen(false);
        return "Opening the explore feed. Discover amazing travel stories and inspiration!";

      case 'navigate':
        if (intent.params.page) {
          navigate(intent.params.page);
          setIsOpen(false);
          return `Navigating to ${intent.params.page === '/' ? 'home' : intent.params.page.replace(/\//g, ' ').trim()} page.`;
        }
        return "I couldn't understand where you want to go.";

      default:
        return "I can help you with:\n• 'Plan a trip to [place] for [X] days'\n• 'Show my bookings' or 'Show my tickets'\n• 'Check PNR 1234567890'\n• 'Find travel buddies to [place]'\n• 'Book a train/flight/bus'\n• 'Go to profile/cart/photo vault'";
    }
  };

  const handleSubmit = async (text?: string, isVoice?: boolean) => {
    const messageText = text || input;
    if (!messageText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      isVoice,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const intent = parseIntent(messageText);
      const response = await executeIntent(intent, isVoice || false);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Read aloud if voice command or auto-read is enabled
      if ((isVoice || autoReadAloud) && ttsSupported) {
        speak(response);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      {/* Floating Button - positioned above bottom nav on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          "bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6",
          isOpen 
            ? "bg-muted text-muted-foreground rotate-90" 
            : "bg-primary text-primary-foreground hover:scale-110"
        )}
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Chat Window - positioned above bottom nav on mobile */}
      {isOpen && (
        <div className={cn(
          "fixed right-6 z-40 w-[360px] max-w-[calc(100vw-3rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in",
          "bottom-[calc(10rem+env(safe-area-inset-bottom,0px))] md:bottom-24"
        )}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold">TraviLink Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              {ttsSupported && (
                <button
                  onClick={() => {
                    if (isSpeaking) {
                      stop();
                    }
                    setAutoReadAloud(!autoReadAloud);
                  }}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    autoReadAloud ? "bg-primary-foreground/20" : "opacity-60 hover:opacity-100"
                  )}
                  title={autoReadAloud ? "Auto-read on" : "Auto-read off"}
                >
                  {autoReadAloud ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 h-[320px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                    {msg.isVoice && (
                      <span className="ml-2 inline-flex items-center">
                        <Mic size={12} className="opacity-60" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-sm">
                    <Loader2 className="animate-spin h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={isListening ? "Listening..." : "Type or speak..."}
              className="flex-1"
              disabled={isProcessing}
            />
            
            {speechSupported && (
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={toggleVoice}
                disabled={isProcessing}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
            )}
            
            <Button
              size="icon"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isProcessing}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
