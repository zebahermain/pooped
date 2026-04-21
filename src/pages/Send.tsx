import { useEffect } from "react";
import { Navigate } from "react-router-dom";

/**
 * The old /send page has been retired — the send flow is now a bottom
 * sheet inside /reservoir. Any link/bookmark to /send simply redirects
 * there. The sheet auto-opens when the user taps Launch.
 */
const Send = () => {
  useEffect(() => {
    document.title = "Launch 💩 — Pooped";
  }, []);
  return <Navigate to="/reservoir" replace />;
};

export default Send;
