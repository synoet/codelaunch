import { useState, useEffect } from "react";
import axios from "axios";

export const useAuthSession = () => {
  const [profile, setProfile] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<
    "authenticated" | "unauthenticated" | "loading"
  >("loading");

  useEffect(() => {
    axios
      .get("/api/auth/whoami")
      .then((res) => {
        setStatus("authenticated");
        setProfile(res.data);
        setIsLoading(false);
      })
      .catch((e) => {
        console.log(e);
        setStatus("unauthenticated");
        setIsLoading(false);
        setProfile(undefined);
      });
  }, []);

  return { profile, isLoading, status };
};
