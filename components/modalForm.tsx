import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Button,
  Alert,
  Image,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as Application from "expo-application";
import axios from "axios";

type QrDetails = {
  Status: number | null;
  Rems: string;
  Details: [
    {
      memid: string;
      memprec: string;
      memname: string;
      mempos: string;
      membrgy: string;
      membd: {
        date: string;
        timezone_type: number;
        timezone: string;
      };
      scand: string;
    }
  ];
};

type DeviceDataType = {
  status: string;
  data: {
    deviceId: string;
    deviceAssignedEncoder: string;
    deviceManufacturer: string;
    deviceModel: string;
    deviceUniqueId: string;
    devicePermission: string;
  };
};

type ModalFormProps = {
  onClose: () => void;
  qrDetails: QrDetails[];
  qrScanned: string;
  refNo: string | null;
};

const screenWidth = Dimensions.get("window").width;
const cameraHeight = (screenWidth * 4) / 3;

export default function ModalForm({
  onClose,
  qrDetails,
  qrScanned,
  refNo,
}: ModalFormProps) {
  const [isSwitchingCamera, setIsSwitchingCamera] = useState<boolean>(false);
  const [deviceData, setDeviceData] = useState<DeviceDataType | null>(null);

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("deviceData");
        if (storedData) {
          setDeviceData(JSON.parse(storedData));
        }
        console.log(storedData);
      } catch (error) {
        console.log("Error retrieving device data:", error);
      }
    };

    fetchDeviceData();
  }, []);

  const openCameraModal = () => {
    setIsSwitchingCamera(true);
    setTimeout(() => {
      setIsSwitchingCamera(false);
      onClose();
    }, 1000);
  };

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const getTimeDetails = () => {
    const now = new Date();
    return `${now.getFullYear()}${
      now.getMonth() + 1
    }${now.getDate()}${now.getHours()}${now.getSeconds()}`;
  };

  const time = getTimeDetails();

  const uploadImage = async (photoUri: string) => {
    if (!photoUri) {
      return;
    }

    try {
      const formData = new FormData();
      const fileInfo = await FileSystem.getInfoAsync(photoUri);

      if (!fileInfo.exists) {
        Alert.alert("Error", "File does not exist.");
        return;
      }

      formData.append("memberAttendance", {
        uri: photoUri,
        name: `${deviceData?.data.deviceUniqueId}-${time}.jpg`,
        type: "image/jpeg",
      } as any);

      const response = await axios.post(
        "https://cleanfuel.com.ph/cfportal_assets/memberAttendance.php",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      openCameraModal();
      console.log("upload is triggered");
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Upload Failed", "Could not upload image.");
    }
  };

  const handleSubmitCapture = async (photoUri: string) => {
    if (!photoUri) {
      Alert.alert("No Image", "Please capture an image first.");
      return;
    }

    const FormData = require("form-data");
    let data = new FormData();
    data.append(
      "attendance",
      `{"attendee":[{"attendeeStat":"${qrDetails[0]?.Status}","patawagRef":"${refNo}","scannedQR":"${qrScanned}","attendeeImg":"${deviceData?.data.deviceUniqueId}-${time}","assignedEncoder":"${deviceData?.data.deviceUniqueId}"}]}`
    );

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://cleanfuel.com.ph/BCS2025/api/bcspatawagtrans.php",
      headers: {
        Authorization: "Basic QkNTUmVydHVybjpFbGVjdGlvbjIwMjU=",
        "Content-Type": "multipart/form-data",
      },
      data: data,
    };

    try {
      const response = await axios.request(config);
      console.log(JSON.stringify(response.data));
      if (response.data.Status === 1 && response.data.Rems === "Record Saved") {
        uploadImage(photoUri);
        console.log("save is triggered");
      } else if (
        response.data.Status === 1 &&
        response.data.Rems === "Wala sa patawag..."
      ) {
        uploadImage(photoUri);
        Alert.alert("Error", `Wala sa Patawag`, [
          {
            text: "Done",
            onPress: openCameraModal,
          },
        ]);
      }
      Alert.alert("Error", `Wala sa Patawag`, [
        {
          text: "Done",
          onPress: openCameraModal,
        },
      ]);
    } catch (error) {
      console.log(error);
    } finally {
    }
  };

  const handleCaptureAndSubmit = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        setCapturedPhoto(photo.uri);
        setTimeout(() => {
          handleSubmitCapture(photo.uri);
        }, 1500);
      } else {
        console.warn("Failed to capture image");
      }
    }
  };

  const handleSubmitSave = async () => {
    const FormData = require("form-data");
    let data = new FormData();
    data.append(
      "attendance",
      `{"attendee":[{"attendeeStat":"${qrDetails[0]?.Status}","patawagRef":"${refNo}","scannedQR":"${qrScanned}","attendeeImg":"default","assignedEncoder":"${deviceData?.data.deviceUniqueId}"}]\n}`
    );

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://cleanfuel.com.ph/BCS2025/api/bcspatawagtrans.php",
      headers: {
        Authorization: "Basic QkNTUmVydHVybjpFbGVjdGlvbjIwMjU=",
        "Content-Type": "multipart/form-data",
      },
      data: data,
    };

    setIsSubmitting(true);

    try {
      const response = await axios.request(config);
      console.log(JSON.stringify(response.data));
      if (response.data.Status === 1 && response.data.Rems === "Record Saved") {
        console.log("save is triggered");
      } else if (
        response.data.Status === 1 &&
        response.data.Rems === "Wala sa patawag..."
      ) {
        Alert.alert("Error", `Wala sa Patawag`, [
          {
            text: "Done",
            onPress: openCameraModal,
          },
        ]);
      }
      Alert.alert("Error", `Wala sa Patawag`, [
        {
          text: "Done",
          onPress: openCameraModal,
        },
      ]);
    } catch (error) {
      console.log(error);
    } finally {
      openCameraModal();
      setIsSubmitting(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <View style={styles.centeredView}>
        {!capturedPhoto ? (
          <>
            {!isSwitchingCamera ? (
              <>
                <CameraView
                  style={[styles.camera, { height: cameraHeight }]}
                  facing={"back"}
                  ref={cameraRef}
                  ratio="4:3"
                />
              </>
            ) : (
              <>
                <View style={[styles.camera, { height: cameraHeight }]} />
              </>
            )}
          </>
        ) : (
          <Image
            source={{ uri: capturedPhoto }}
            style={[styles.camera, { height: cameraHeight }]}
            resizeMode="contain"
          />
        )}
        <View style={styles.buttonParentContainer}>
          <TouchableOpacity style={styles.buttonContainer} onPress={handleCaptureAndSubmit}>
            <Text style={styles.buttonText}>Capture</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonContainer}  onPress={handleSubmitSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.buttonContainerClose} onPress={openCameraModal}>
          <Text style={styles.buttonTextClose}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    opacity: 0.5,
  },
  centeredView: {
    height: "90%",
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    zIndex: 10,
  },
  camera: {
    width: "100%",
    height: "auto",
    backgroundColor: "black",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "black",
  }, 
  buttonParentContainer:{
    width:'100%',
    height:'auto',
    flexDirection:'row',
    justifyContent:'center',
    alignContent:"center",
    gap:10,
  },

  buttonContainer: {
    width: '48%',
    height: 55,
    borderWidth: 3,
    borderColor: "black",
    marginTop: 20,
    borderRadius: 15,
    backgroundColor: "white",
  },

  buttonText: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    textAlignVertical: "center",
    color: "black",
    fontSize: 20,
  },

  buttonContainerClose: {
    width: '100%',
    height: 55,
    borderWidth: 3,
    borderColor: "black",
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: "red",
  },
  
  buttonTextClose: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    textAlignVertical: "center",
    color: "white",
    fontSize: 20,
  },
});
