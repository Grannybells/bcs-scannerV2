import {
  View,
  Text,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  BackHandler,
  Image,
} from "react-native";
import * as Application from "expo-application";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Device from "expo-device";

export default function Index() {
  // const router = useRouter();
  // const [deviceId, setDeviceId] = useState<string | null>(null);
  // const [location, setLocation] =
  //   useState<Location.LocationObjectCoords | null>(null);
  // const [loading, setLoading] = useState(false); // Loading state

  // useEffect(() => {
  //   const getLocation = async () => {
  //     let { status } = await Location.requestForegroundPermissionsAsync();
  //     if (status !== "granted") {
  //       Alert.alert("Location", "Permission to access location was denied");
  //       return;
  //     }
  //     let loc = await Location.getCurrentPositionAsync({});
  //     setLocation(loc.coords);
  //   };
  //   getLocation();
  // }, []);

  // useEffect(() => {
  //   async function fetchDeviceId() {
  //     let id = null;
  //     if (Platform.OS === "android") {
  //       id = await Application.getAndroidId();
  //     } else if (Platform.OS === "ios") {
  //       id = await Application.getIosIdForVendorAsync();
  //     }
  //     setDeviceId(id);
  //   }
  //   fetchDeviceId();
  // }, []);

  // const handleRegister = async () => {
  //   if (!deviceId) return;
  //   const FormData = require("form-data");
  //   let data = new FormData();
  //   data.append("action", "register");
  //   data.append("deviceManufacturer", `${Device.manufacturer}`);
  //   data.append("deviceModel", `${Device.brand} - ${Device.modelName}`);
  //   data.append("deviceUniqueId", deviceId);

  //   let config = {
  //     method: "post",
  //     maxBodyLength: Infinity,
  //     url: "https://cleanfuel.com.ph/BCS2025/api/deviceDetailsAccess.php",
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //     data: data,
  //   };

  //   try {
  //     const response = await axios.request(config);
  //     console.log(response);
  //     if (response.data.status === "success") {
  //       Alert.alert(
  //         "Success",
  //         "The device your using is register, wait for admin to grant access",
  //         [{ text: "OK", onPress: () => BackHandler.exitApp() }]
  //       );
  //     } else if (response.data.status === "error") {
  //       Alert.alert("Error", "Device is already registered", [
  //         { text: "OK", onPress: () => BackHandler.exitApp() },
  //       ]);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const handleLogin = async () => {
  //   if (loading) return;
  //   if (!deviceId || !location) return;
  //   setLoading(true);

  //   const FormData = require("form-data");
  //   let data = new FormData();
  //   data.append("action", "login");
  //   data.append("deviceUniqueId", deviceId);
  //   data.append("deviceLongitude", `${location.longitude}`);
  //   data.append("deviceLatitude", `${location.latitude}`);

  //   let config = {
  //     method: "post",
  //     maxBodyLength: Infinity,
  //     url: "https://cleanfuel.com.ph/BCS2025/api/deviceDetailsAccess.php",
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //     data: data,
  //   };

  //   try {
  //     const response = await axios.request(config);
  //     await new Promise((resolve) => setTimeout(resolve, 2000));
  //     if (response.data.status === "authorize") {
  //       await AsyncStorage.setItem("deviceData", JSON.stringify(response.data));
  //       router.replace("/(auth)/home");
  //     } else if (response.data.status === "unauthorize") {
  //       Alert.alert("Unauthorized", "You are using an unauthorized device", [
  //         { text: "OK", onPress: () => BackHandler.exitApp() },
  //       ]);
  //     } else {
  //       Alert.alert(
  //         "Not Registered",
  //         "You are using an unregistered device. Registering now...",
  //         [
  //           {
  //             text: "OK",
  //             onPress: async () => {
  //               await handleRegister();
  //               BackHandler.exitApp();
  //             },
  //           },
  //         ],
  //         { cancelable: false }
  //       );
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (deviceId && location) {
  //     handleLogin();
  //   }
  // }, [deviceId, location]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
         <Image source={require('../assets/images/splash-icon.png')} style={{ width: 250, height: 150 }}/>
         <ActivityIndicator size="large" color="#0000ff" />
      {/* {loading ? <ActivityIndicator size="large" color="#0000ff" /> : null} */}
    </SafeAreaView>
  );
}
