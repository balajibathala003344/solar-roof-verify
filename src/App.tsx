import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Home from "./pages/Home";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import Apply from "./pages/Apply";
import UserDashboard from "./pages/UserDashboard";
import OfficerDashboard from "./pages/OfficerDashboard";
import ApplicationDetail from "./pages/ApplicationDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/officer-dashboard" element={<OfficerDashboard />} />
            <Route path="/application/:id" element={<ApplicationDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
