import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

type ScannedData = {
  scanqr: string;
  attimg: string;
  encodeby: string;
  trandate: {
    date: string;
    timezone_type: number;
    timezone: string;
  };
  bsFullName: string;
  bsBarangay: string;
  bsCluster: string;
  bsContactNo: string;
  bsPosCode: string;
  dateofpatawag: {
    date: string;
    timezone_type: number;
    timezone: string;
  };
  psVenue: string;
  Remarks: string;
};

type ModalTableProps = {
  onClose: () => void;
  refNo: string | null;
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

export default function ModalTable({ onClose, refNo }: ModalTableProps) {
  const [scannedAttendee, setScannedAttendee] = useState<ScannedData[]>([]);
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

  console.log(`${deviceData?.data.deviceUniqueId}`)
  const getCurrentFormattedDate = (): string => {
    const today = new Date();
    return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  };

  useEffect(() => {
    const attendanceRequest = async () => {
      const formattedDate = getCurrentFormattedDate();
      const data = new FormData();

      data.append("refno", `${refNo}`);
      data.append("caucusrep", `${deviceData?.data.deviceUniqueId}`);
      data.append("dtfrom", formattedDate);
      data.append("dtto", formattedDate);

      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://cleanfuel.com.ph/BCS2025/api/reports.php",
        headers: {
          Authorization: "Basic QkNTUmVydHVybjpFbGVjdGlvbjIwMjU=",
          "Content-Type": "multipart/form-data",
        },
        data: data,
      };

      try {
        const response = await axios.request(config);
        if (response.data.Status === 1) {
          setScannedAttendee(response.data.Details);
        } else if (response.data.Status === 0) {
          setScannedAttendee([]);
        }
        console.log(JSON.stringify(response.data));
      } catch (error) {
        console.log(error);
      }
    };
    attendanceRequest();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <View style={styles.centeredView}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.headerRow]}>
            <Text
              style={[styles.tableCell, styles.headerText, styles.nameColumn]}
            >
              Name
            </Text>
            <Text
              style={[styles.tableCell, styles.headerText, styles.posColumn]}
            >
              Pos
            </Text>
          </View>

          <FlatList
            data={scannedAttendee}
            keyExtractor={(item) => item.scanqr}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.nameColumn]}>
                  {item?.bsFullName}
                </Text>
                <Text style={[styles.tableCell, styles.posColumn]}>
                  {item?.Remarks}
                </Text>
              </View>
            )}
          />
        </View>
        <TouchableOpacity style={styles.buttonContainer} onPress={onClose}>
          <Text style={styles.buttonText}>close</Text>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    opacity: 0.5,
  },
  centeredView: {
    height: "95%",
    width: "95%",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "white",
    padding: 3,
    borderRadius: 10,
    zIndex: 10,
  },
  tableContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    height:'93%'
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerRow: {
    backgroundColor: "#f0f0f0",
  },
  tableCell: {
    textAlign: "center",
    fontSize: 16,
  },
  headerText: {
    fontWeight: "bold",
  },
  nameColumn: {
    flex: 7,
  },
  posColumn: {
    flex: 3,
  },
  buttonContainer:{
    width: 300,
    height: 50,
    borderWidth: 3,
    marginTop:2,
    borderColor: "white",
    borderRadius: 27.5,
    backgroundColor: "black",
  },
  buttonText:{
    width: "100%",
    height: "100%",
    textAlign: "center",
    textAlignVertical: "center",
    color: "white",
    fontSize: 20,
  }
});
