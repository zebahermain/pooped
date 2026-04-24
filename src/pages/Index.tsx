import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Home from "./Home";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");
    if (redirect) {
      navigate(redirect, { replace: true });
    }
  }, [location, navigate]);

  return <Home />;
};

export default Index;
