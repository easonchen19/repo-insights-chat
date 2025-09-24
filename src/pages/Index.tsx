import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "@/components/Hero";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to chat interface
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  return <Hero />;
};

export default Index;
