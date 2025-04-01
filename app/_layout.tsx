import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem("deviceData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          setIsAuthenticated(parsedData.data.devicePermission === "1");
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error retrieving user data:", error);
        setIsAuthenticated(false);
      }
    };
  
    checkAuthStatus();
  
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkAuthStatus(); 
      }
    });
  
    return () => subscription.remove();
  }, []);
  

  useEffect(() => {
    if (isAuthenticated) {
      // console.log("User is authenticated:c", isAuthenticated);
      router.replace("/(auth)/home");
    } else {
      // console.log("User is authenticated:d", isAuthenticated);
      router.replace("/"); 
    }
  }, [router]);
  
  return <Slot />;
}
