import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Bot, User, Mic, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI Travel Assistant. I can help you with:\n\n• Train ticket bookings\n• PNR status enquiry\n• Refund queries\n• Train schedules\n• General travel assistance\n\nHow can I assist you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickQuestions = [
    "How to check PNR status?",
    "Cancel my ticket",
    "Refund policy",
    "Train running status"
  ];

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("pnr") || lowerQuery.includes("status")) {
      return "To check your PNR status:\n\n1. Go to 'PNR Enquiry' from the main menu\n2. Enter your 10-digit PNR number\n3. Click 'Check Status'\n\nYour PNR can be found on your ticket or booking confirmation email.";
    }
    
    if (lowerQuery.includes("cancel") || lowerQuery.includes("cancellation")) {
      return "To cancel your ticket:\n\n1. Go to 'Cancel Ticket' from the main menu\n2. Select the ticket you want to cancel\n3. Confirm cancellation\n\n**Note:** Cancellation charges apply based on timing. Refund is processed within 5-7 business days.";
    }
    
    if (lowerQuery.includes("refund")) {
      return "Refund Policy:\n\n• 48+ hours before: 25% charges\n• 12-48 hours before: 50% charges\n• Less than 12 hours: No refund\n\nFor AC classes, refund is processed to original payment method. Check 'Refund History' for status.";
    }
    
    if (lowerQuery.includes("running") || lowerQuery.includes("track") || lowerQuery.includes("delay")) {
      return "To track your train:\n\n1. Go to 'Track Your Train' from the main menu\n2. Enter your train number or PNR\n3. View real-time location and delays\n\nThe tracking updates every few minutes with current station and expected arrival time.";
    }
    
    if (lowerQuery.includes("book") || lowerQuery.includes("ticket")) {
      return "To book a train ticket:\n\n1. Go to 'Book Ticket' from the main menu\n2. Enter source, destination, and date\n3. Select your preferred train and class\n4. Enter passenger details\n5. Complete payment\n\nYour e-ticket will be sent via email and SMS.";
    }
    
    return "I understand you're asking about \"" + query + "\". Let me help you with that.\n\nFor specific queries, you can:\n• Use 'PNR Enquiry' to check ticket status\n• Use 'Track Train' for live updates\n• Use 'My Bookings' to view your tickets\n\nIs there anything specific I can help you with?";
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getAIResponse(input)
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />
      
      <div className="container mx-auto px-4 py-4 max-w-2xl flex-1 flex flex-col">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/book-transport')}
          className="mb-4 w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Booking
        </Button>

        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span>AI Travel Assistant</span>
                <p className="text-sm font-normal text-muted-foreground">Ask me anything about train travel</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                        <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.1s]" />
                        <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-sm text-muted-foreground mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(q);
                      }}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={loading}
                />
                <Button size="icon" variant="outline" disabled>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}