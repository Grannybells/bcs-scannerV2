import {
  StyleSheet,
  View,
  Text,
  Button,
  TouchableOpacity,
  Alert,
  TextInput,
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
  const [clusterCode, setClusterCode] = useState<string>("");
  const [loadingInput, setLoadingInput] = useState<boolean>(false);

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

  const processClusterCode = async (clusterCode: string) => {
    let payload = new FormData();
    payload.append("cpCluster", clusterCode);

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
      if (response.data.status === "1" && response.data.rems === "Success") {
        const DataFetch = response.data.Details[0];
        router.replace({
          pathname: "/(auth)/resultScreen",
          params: { scannedData: JSON.stringify(DataFetch) },
        });
      } else {
        Alert.alert("Invalid cluster", "Please enter a valid cluster code.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Server error", "Something happened, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!scanned && isScanRequested) {
      setScanned(true);
      setIsScanRequested(false);

      try {
        const parsed = JSON.parse(data);
        if (typeof parsed.bsCluster === "string") {
          await processClusterCode(parsed.bsCluster);
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

        <TextInput
          keyboardType="number-pad"
          placeholder="Enter Cluster code"
          value={clusterCode}
          onChangeText={setClusterCode}
          style={{
            marginTop: 20,
            borderWidth: 3,
            backgroundColor: "white",
            padding: 10,
            width: 325,
            height: "auto",
            fontSize: 16,
            borderRadius: 10,
          }}
        />
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={async () => {
            if (clusterCode.trim()) {
              // If manual input is filled, use that
              await processClusterCode(clusterCode.trim());
            } else {
              // Otherwise, trigger scan
              setScanned(false); // Reset scanned flag
              setIsScanRequested(true);
            }
          }}
        >
          <Text style={styles.buttonText}>
            {loading ? "Loading..." : "Submit or Scan"}
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
