import {
  StyleSheet,
  View,
  Text,
  Button,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import axios from "axios";

export default function Home() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanRequested, setIsScanRequested] = useState(false);
  const [parsedData, setParsedData] = useState<{
    bsBarangay: string;
    bsCluster: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!scanned && isScanRequested) {
      setScanned(true);
      setIsScanRequested(false);

      try {
        const parsedData = JSON.parse(data);

        if (
          typeof parsedData.bsBarangay === "string" &&
          typeof parsedData.bsCluster === "string"
        ) {
          let payload = new FormData();
          payload.append("cpCluster", `${parsedData.bsCluster}`);
          payload.append("cpBarangay", `${parsedData.bsBarangay}`);

          let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://cleanfuel.com.ph/BCS2025/api/brgyCluster.php",
            headers: {
              "Content-Type": "multipart/form-data",
            },
            data: payload,
          };
          setLoading(true);
          try {
            const response = await axios.request(config);
            console.log(JSON.stringify(response.data));
            if (
              response.data.status === "1" &&
              response.data.rems === "Success"
            ) {
              const DataFetch = response.data.Details[0];
              router.replace({
                pathname: "/(auth)/resultScreen",
                params: { scannedData: JSON.stringify(DataFetch) },
              });
            }
          } catch (error) {
            console.log(error);
            Alert.alert("Server error", "Something happen, please try again", [
              { text: "OK", onPress: () => {} },
            ]);
          } finally {
            setLoading(false);
          }
        } else {
          throw new Error("Invalid structure");
        }
      } catch (error) {
        Alert.alert(
          "Invalid QR Code",
          "The scanned data is not valid. Please scan a correct QR code.",
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          zoom={0.1}
        >
          <View style={styles.overlay}>
            <View style={styles.frame} />
          </View>
        </CameraView>

        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => {
            setScanned(false); // reset for rescan
            setIsScanRequested(true);
          }}
        >
          <Text style={styles.buttonText}>
            {loading ? "Loading..." : "Scan"}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.version}>Version 10.17.1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8E9EB",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: 325,
    height: 325,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 20,
  },
  overlay: {
    position: "absolute",
    width: 325,
    height: 325,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: 150,
    height: 150,
    borderColor: "white",
    borderWidth: 6,
    borderRadius: 10,
    borderStyle: "solid",
    backgroundColor: "transparent",
  },
  pickerContainer: {
    width: 325,
    height: "auto",
  },
  pickerViewer: {
    width: 325,
    height: 50,
    borderWidth: 3,
    borderColor: "black",
    marginBottom: 30,
    borderRadius: 10,
  },
  pickerText: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 5,
  },
  buttonContainer: {
    width: 325,
    height: 55,
    borderWidth: 3,
    borderColor: "white",
    marginTop: 50,
    borderRadius: 27.5,
    backgroundColor: "black",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.3,
    elevation: 13,
  },
  buttonText: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    textAlignVertical: "center",
    color: "white",
    fontSize: 20,
  },
  version: {
    padding: 5,
    fontStyle: "italic",
  },
});
