import {
  StyleSheet,
  View,
  Text,
  Button,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { formatDate } from "@/lib/dateTime";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import ModalForm from "./modalForm";

type CaucusData = {
  refno: string;
  purp: string;
  date: {
    date: string;
    timezone_type: number;
    timezone: string;
  };
};

type QrDetails = {
  Status: number;
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

export default function CameraQR() {
  const [caucusSched, setCaucusSched] = useState<CaucusData[]>([]);
  const [selectedRefNo, setSelectedRefNo] = useState<string | null>(null);

  useEffect(() => {
    const caucusRequest = async () => {
      let data = new FormData();
      data.append("caucuspatawag", "");

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://cleanfuel.com.ph/BCS2025/api/caucuspatawag.php",
        headers: {
          Authorization: "Basic QkNTUmVydHVybjpFbGVjdGlvbjIwMjU=",
          "Content-Type": "multipart/form-data",
        },
        data: data,
      };
      try {
        const response = await axios.request(config);
        if (response.data.Status === 1) {
          setCaucusSched(response.data.Details);
        }
      } catch (error) {
        console.log(error);
      }
    };
    caucusRequest();
  }, []);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedQr, setScannedQr] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState<boolean>(false);
  const [qrDetails, setQrDetails] = useState<QrDetails[]>([]);
  const [isScanRequested, setIsScanRequested] = useState<boolean>(false);

  const openCameraModal = (details: QrDetails, scannedData: string) => {
    setIsSwitchingCamera(true);
    setQrDetails([details]);
    setScannedQr(scannedData);

    setTimeout(() => {
      setModalVisible(true);
      setScanned(false);
      setIsSwitchingCamera(false);
    }, 1000);
  };

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
      if (!selectedRefNo) {
        Alert.alert("Error", "Please select a schedule before scanning.");
        setIsScanRequested(false);
        return;
      }
      setScanned(true);
      setIsScanRequested(false);
      let formData = new FormData();
      formData.append("bcsmembno", data);

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://cleanfuel.com.ph/BCS2025/api/bcsmemberatten.php",
        headers: {
          Authorization: "Basic QkNTUmVydHVybjpFbGVjdGlvbjIwMjU=",
          "Content-Type": "multipart/form-data",
        },
        data: formData,
      };

      try {
        const response = await axios.request(config);
        openCameraModal(response.data, data);
        console.log(response.data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerText}>Barangay Schedule</Text>
          <View style={styles.pickerViewer}>
            <Picker
              selectedValue={selectedRefNo}
              onValueChange={(itemValue) => setSelectedRefNo(itemValue)}
              style={{ fontSize: 14 }} 
            >
              <Picker.Item label="Select a schedule" value={null} style={{ fontSize: 14 }}/>
              {caucusSched.map((item) => (
                <Picker.Item
                  key={item.refno}
                  label={`${item.purp} - ${formatDate(item.date.date)}`}
                  value={item.refno}
                  style={{ fontSize: 14 }}
                />
              ))}
            </Picker>
          </View>
        </View>
        {!modalVisible && !isSwitchingCamera ? (
          <CameraView
            style={styles.camera}
            facing={"back"}
            onBarcodeScanned={handleBarcodeScanned}
            zoom={0}
          >
            <View style={styles.overlay}>
              <View style={styles.frame} />
            </View>
          </CameraView>
        ) : (
          <View style={styles.camera}>
            <View style={styles.overlay}>
              <View style={styles.frame} />
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => setIsScanRequested(true)}
        >
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
          setIsSwitchingCamera(false);
          setScanned(false);
        }}
      >
        <ModalForm
          onClose={() => {
            setModalVisible(false);
            setIsSwitchingCamera(false);
            setScanned(false);
          }}
          qrDetails={qrDetails}
          qrScanned={scannedQr}
          refNo={selectedRefNo}
        />
      </Modal>
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
});
