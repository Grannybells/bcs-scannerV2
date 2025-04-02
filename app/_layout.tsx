import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Slot } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, AppState, Linking, BackHandler } from "react-native";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();
  const appVersion = "10.17.1"; // Your current app version
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [appLink, setAppLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestVersion = async () => {
      try {
        const response = await axios.get(
          "https://cleanfuel.com.ph/BCS2025/api/appVersions.php"
        );
        const fetchedVersion = response.data.data[0].latestVersion; // Get version directly
        const fetchedLink = response.data.data[0].appLink; // Get version directly
        console.log(
          "Fetched Latest Version:",
          fetchedVersion,
          "and",
          fetchedLink
        );
        setAppLink(fetchedLink);
        setLatestVersion(fetchedVersion); // Store version properly
      } catch (error) {
        console.error("Error fetching latest version:", error);
      }
    };

    fetchLatestVersion();
  }, []);

  const isOutdated = (current: string, latest: string) => {
    const currentParts = current.split(".").map(Number);
    const latestParts = latest.split(".").map(Number);

    for (let i = 0; i < latestParts.length; i++) {
      if ((currentParts[i] || 0) < latestParts[i]) {
        return true; // Update needed
      } else if ((currentParts[i] || 0) > latestParts[i]) {
        return false; // Already up-to-date
      }
    }
    return false; // Same version
  };

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

  const checkForUpdate = () => {
    if (latestVersion && isOutdated(appVersion, latestVersion)) {
      Alert.alert(
        "Update Required",
        "A new version is available. Please update to continue.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => BackHandler.exitApp(),
          }, // Close app if canceled
          {
            text: "Update",
            onPress: () => {
              Linking.openURL(`${appLink}`);
              BackHandler.exitApp(); // Close app after opening link
            },
          },
        ],
        { cancelable: false } // Prevent dismissing the alert
      );
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (latestVersion) {
      checkForUpdate(); // Run update check only after latestVersion is fetched
    }
  }, [latestVersion]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkAuthStatus();
        checkForUpdate(); // Run update check when app reopens from background
      }
    });

    return () => subscription.remove();
  }, [latestVersion]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(auth)/home");
    } else {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  return <Slot />;
}
