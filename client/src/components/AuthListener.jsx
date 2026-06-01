import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { showErrorToast } from "../utils/toast";

export default function AuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      const message = e?.detail?.message || "Session expired";
      showErrorToast(message);
      navigate("/");
    };

    window.addEventListener("app:unauthorized", handler);
    return () => window.removeEventListener("app:unauthorized", handler);
  }, [navigate]);

  return null;
}
