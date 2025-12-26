import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Ticket, 
  BookOpen, 
  Search, 
  CalendarDays, 
  FileWarning, 
  BarChart3, 
  Clock, 
  MapPin,
  Train as TrainIcon
} from "lucide-react";

interface ServiceItem {
  icon: React.ElementType;
  label: string;
  color: string;
  route: string;
}

export const TrainServicesGrid = () => {
  const navigate = useNavigate();

  const services: ServiceItem[] = [
    {
      icon: TrainIcon,
      label: "Book Train",
      color: "text-purple-600 bg-purple-100",
      route: "/book-transport"
    },
    {
      icon: BookOpen,
      label: "My Bookings",
      color: "text-green-600 bg-green-100",
      route: "/my-tickets"
    },
    {
      icon: Search,
      label: "PNR Enquiry",
      color: "text-blue-600 bg-blue-100",
      route: "/trains/pnr-enquiry"
    },
    {
      icon: CalendarDays,
      label: "Upcoming Journey",
      color: "text-orange-600 bg-orange-100",
      route: "/my-tickets"
    },
    {
      icon: FileWarning,
      label: "File TDR",
      color: "text-red-600 bg-red-100",
      route: "/trains/file-tdr"
    },
    {
      icon: BarChart3,
      label: "Chart Vacancy",
      color: "text-amber-600 bg-amber-100",
      route: "/trains/chart-vacancy"
    },
    {
      icon: Clock,
      label: "Train Schedule",
      color: "text-emerald-600 bg-emerald-100",
      route: "/trains/schedule"
    },
    {
      icon: MapPin,
      label: "Track Your Train",
      color: "text-red-500 bg-red-100",
      route: "/trains/track-train"
    },
    {
      icon: Ticket,
      label: "My Tickets",
      color: "text-indigo-600 bg-indigo-100",
      route: "/my-tickets"
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
            onClick={() => navigate(service.route)}
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
