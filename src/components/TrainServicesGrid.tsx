import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Ticket, 
  BookOpen, 
  Search, 
  CreditCard, 
  CalendarDays, 
  XCircle, 
  FileWarning, 
  RotateCcw, 
  Wallet, 
  BarChart3, 
  Clock, 
  MapPin, 
  Bot, 
  Train as TrainIcon,
  RefreshCcw 
} from "lucide-react";

interface ServiceItem {
  icon: React.ElementType;
  label: string;
  color: string;
  action: () => void;
}

export const TrainServicesGrid = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const showComingSoon = (feature: string) => {
    toast({ 
      title: "Coming Soon", 
      description: `${feature} will be available soon!` 
    });
  };

  const services: ServiceItem[] = [
    {
      icon: Ticket,
      label: "Book Ticket",
      color: "text-purple-600 bg-purple-100",
      action: () => {} // Already on booking page
    },
    {
      icon: BookOpen,
      label: "My Bookings",
      color: "text-green-600 bg-green-100",
      action: () => navigate("/my-tickets")
    },
    {
      icon: Search,
      label: "PNR Enquiry",
      color: "text-blue-600 bg-blue-100",
      action: () => showComingSoon("PNR Enquiry")
    },
    {
      icon: CreditCard,
      label: "Last Transaction",
      color: "text-slate-600 bg-slate-100",
      action: () => showComingSoon("Last Transaction")
    },
    {
      icon: CalendarDays,
      label: "Upcoming Journey",
      color: "text-orange-600 bg-orange-100",
      action: () => navigate("/my-tickets")
    },
    {
      icon: XCircle,
      label: "Cancel Ticket",
      color: "text-teal-600 bg-teal-100",
      action: () => showComingSoon("Cancel Ticket")
    },
    {
      icon: FileWarning,
      label: "File TDR",
      color: "text-red-600 bg-red-100",
      action: () => showComingSoon("File TDR")
    },
    {
      icon: RotateCcw,
      label: "Refund History",
      color: "text-pink-600 bg-pink-100",
      action: () => showComingSoon("Refund History")
    },
    {
      icon: Wallet,
      label: "IRCTC E-Wallet",
      color: "text-blue-700 bg-blue-100",
      action: () => showComingSoon("IRCTC E-Wallet")
    },
    {
      icon: BarChart3,
      label: "Chart Vacancy",
      color: "text-amber-600 bg-amber-100",
      action: () => showComingSoon("Chart Vacancy")
    },
    {
      icon: Clock,
      label: "Train Schedule",
      color: "text-emerald-600 bg-emerald-100",
      action: () => showComingSoon("Train Schedule")
    },
    {
      icon: MapPin,
      label: "Track Your Train",
      color: "text-red-500 bg-red-100",
      action: () => showComingSoon("Track Your Train")
    },
    {
      icon: Bot,
      label: "Ask Disha 2.0",
      color: "text-cyan-600 bg-cyan-100",
      action: () => showComingSoon("Ask Disha 2.0")
    },
    {
      icon: TrainIcon,
      label: "Delhi Metro",
      color: "text-blue-500 bg-blue-100",
      action: () => showComingSoon("Delhi Metro")
    },
    {
      icon: RefreshCcw,
      label: "Festival Round Trip",
      color: "text-purple-700 bg-purple-100",
      action: () => showComingSoon("Festival Round Trip")
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
      {services.map((service, idx) => {
        const Icon = service.icon;
        return (
          <Card 
            key={idx}
            className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-0 shadow-sm"
            onClick={service.action}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`p-3 rounded-xl mb-2 ${service.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight">
                {service.label}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};