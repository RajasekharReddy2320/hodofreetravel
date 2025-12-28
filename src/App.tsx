import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { ReducedMotionProvider } from "@/contexts/ReducedMotionContext";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
import { NotificationInitializer } from "@/components/NotificationInitializer";
import AIChatBot from "@/components/AIChatBot";
import Welcome from "./pages/Welcome";
import Explore from "./pages/Explore";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import PlanTrip from "./pages/PlanTrip";
import PlannerV2 from "./pages/PlannerV2";
import Book from "./pages/Book";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import CreateTrip from "./pages/CreateTrip";
import SearchUsers from "./pages/SearchUsers";
import BookingHub from "./pages/BookingHub";
import BookConfirm from "./pages/BookConfirm";
import MyTickets from "./pages/MyTickets";
import TicketDetails from "./pages/TicketDetails";
import Cart from "./pages/Cart";
import TravelBuddies from "./pages/TravelBuddies";
import NotFound from "./pages/NotFound";
import TravelAgents from "./pages/TravelAgents";
import LocalGuides from "./pages/LocalGuides";
import GeneratedItineraries from "./pages/GeneratedItineraries";
import PhotoVault from "./pages/PhotoVault";
import Knowledge from "./pages/Knowledge";
import PNREnquiry from "./pages/trains/PNREnquiry";
import FileTDR from "./pages/trains/FileTDR";
import ChartVacancy from "./pages/trains/ChartVacancy";
import TrainSchedule from "./pages/trains/TrainSchedule";
import TrackTrain from "./pages/trains/TrackTrain";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ReducedMotionProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationPermissionBanner />
          <NotificationInitializer />
          <BrowserRouter>
            <AIChatBot />
            <Routes>
              <Route path="/" element={<Explore />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/plan-trip" element={<Dashboard />} />
              <Route path="/ai-planner" element={<PlanTrip />} />
              <Route path="/planner" element={<PlannerV2 />} />
              <Route path="/generated-itineraries" element={<GeneratedItineraries />} />
              <Route path="/create-trip" element={<CreateTrip />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/search" element={<SearchUsers />} />
              <Route path="/book-transport" element={<BookingHub />} />
              <Route path="/book-confirm" element={<BookConfirm />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/ticket-details" element={<TicketDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/travel-buddies" element={<TravelBuddies />} />
              <Route path="/book" element={<Book />} />
              <Route path="/travel-agents" element={<TravelAgents />} />
              <Route path="/local-guides" element={<LocalGuides />} />
              <Route path="/photo-vault" element={<PhotoVault />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/trains/pnr-enquiry" element={<PNREnquiry />} />
              <Route path="/trains/file-tdr" element={<FileTDR />} />
              <Route path="/trains/chart-vacancy" element={<ChartVacancy />} />
              <Route path="/trains/schedule" element={<TrainSchedule />} />
              <Route path="/trains/track-train" element={<TrackTrain />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </ReducedMotionProvider>
  </QueryClientProvider>
);

export default App;
