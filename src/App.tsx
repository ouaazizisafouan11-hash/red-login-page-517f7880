import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Dreams from "./pages/Dreams.tsx";
import MiniGames from "./pages/MiniGames.tsx";
import GamePlay from "./pages/GamePlay.tsx";
import NotFound from "./pages/NotFound.tsx";
import { useGameReadyNotifications } from "./hooks/useGameReadyNotifications";
import { PageTransition } from "./components/GoldUI";

const queryClient = new QueryClient();

const GlobalNotifications = () => {
  useGameReadyNotifications();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlobalNotifications />
      <BrowserRouter>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/dreams" element={<Dreams />} />
            <Route path="/mini-games" element={<MiniGames />} />
            <Route path="/play/:id" element={<GamePlay />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
