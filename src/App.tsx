import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import GameChat from "./pages/GameChat.tsx";
import GameLibrary from "./pages/GameLibrary.tsx";
import GamePlay from "./pages/GamePlay.tsx";
import NotFound from "./pages/NotFound.tsx";
import { useGameReadyNotifications } from "./hooks/useGameReadyNotifications";

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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/chat" element={<GameChat />} />
          <Route path="/games" element={<GameLibrary />} />
          <Route path="/play/:id" element={<GamePlay />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
