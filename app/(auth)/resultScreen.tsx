import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Make sure expo/vector-icons is installed
import React, { useEffect, useState } from "react";
import axios from "axios";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CandidateDetail {
  cdRefNo: string;
  cdPos: string;
  cdName: string;
  cdBold: string | null;
}

interface VoteEntry {
  candidatePos: string;
  candidateName: string;
  barangay: string;
  cluster: string;
  voteCount: number;
  encoderName: string;
  regVoters: number;
}

interface ExistingVoteDetail {
  candidatePos: string;
  candidateName: string;
  barangay: string;
  cluster: string;
  voteCount: number;
  encoderName: string;
}

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

export default function ResultScreen() {
  const { scannedData } = useLocalSearchParams();
  const [parsedData, setParsedData] = useState<{
    cpCluster: string;
    cpBarangay: string;
    cpPollingCenter: string;
    cpRegVoters: string;
  } | null>(null);
  const [congressmanData, setCongresmanData] = useState<CandidateDetail[]>([]);
  const [councillorData, setCouncillorData] = useState<CandidateDetail[]>([]);
  const [existingData, setExistingData] = useState<ExistingVoteDetail[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceDataType | null>(null);
  const [votes, setVotes] = useState<{ [refNo: string]: string }>({});
  const [preparedEntries, setPreparedEntries] = useState<VoteEntry[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorInputs, setErrorInputs] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [ballotsCast, setBallotsCast] = useState<string>("");

  useEffect(() => {
    if (scannedData) {
      try {
        const json = JSON.parse(scannedData as string);
        setParsedData(json);
      } catch (err) {
        console.error("Error parsing scanned data:", err);
      }
    }
  }, [scannedData]);

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("deviceData");
        if (storedData) {
          setDeviceData(JSON.parse(storedData));
          // console.log("Data", JSON.parse(storedData));
        }
        // console.log(storedData);
      } catch (error) {
        console.log("Error retrieving device data:", error);
      }
    };

    fetchDeviceData();
  }, []);

  useEffect(() => {
    const makeRequest = async () => {
      let data = new FormData();
      data.append("action", "getData");
      data.append("clusterCode", `${parsedData?.cpCluster}`);
      data.append("encoderName", `${deviceData?.data?.deviceAssignedEncoder}`);

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://cleanfuel.com.ph/BCS2025/api/candidateVotes.php",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        data: data,
      };

      try {
        const response = await axios.request(config);
        // console.log(response.data);
        if (
          response.data.Status === "1" &&
          response.data.Remarks === "Successful"
        ) {
          setExistingData(response.data.Details);
          // console.log(response.data.Details);
        }
      } catch (error) {
        console.log("This is existing data", error);
      }
    };
    makeRequest();
  }, [parsedData, deviceData]);

  useEffect(() => {
    const makeRequest = async () => {
      const data = new FormData();
      data.append("action", "getCandidates");
      data.append("candidatePos", "CO");

      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://cleanfuel.com.ph/BCS2025/api/candidateVotes.php",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        data: data,
      };

      try {
        const response = await axios.request(config);
        // console.log(JSON.stringify(response.data));
        setCouncillorData(response.data.Details);
      } catch (error) {
        console.log("This is congressman data", error);
      }
    };

    makeRequest();
  }, [parsedData, deviceData]);

  useEffect(() => {
    const makeRequest = async () => {
      const data = new FormData();
      data.append("action", "getCandidates");
      data.append("candidatePos", "CG");

      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://cleanfuel.com.ph/BCS2025/api/candidateVotes.php",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        data: data,
      };

      try {
        const response = await axios.request(config);
        console.log("This is councillor data", JSON.stringify(response.data));
        setCongresmanData(response.data.Details);
      } catch (error) {
        console.log(error);
      }
    };
    makeRequest();
  }, [parsedData, deviceData]);

  useEffect(() => {
    if (existingData && existingData.length > 0) {
      const initialVotes = existingData.reduce((acc, curr) => {
        const candidateKey = `${curr.candidatePos}-${curr.candidateName}`;
        acc[candidateKey] = String(curr.voteCount);
        return acc;
      }, {} as { [key: string]: string });

      setVotes(initialVotes);
    }
  }, [existingData, parsedData, deviceData]);

  const prepareAndPreviewVote = () => {
    const allCandidates = [...congressmanData, ...councillorData];

    const missingVotes = allCandidates.some((candidate) => {
      const vote = votes[`${candidate.cdPos}-${candidate.cdName}`];
      const voteNumber = Number(vote);
      return (
        vote === undefined ||
        vote === "" ||
        isNaN(voteNumber) ||
        !Number.isInteger(voteNumber)
      );
    });

    if (missingVotes) {
      Alert.alert(
        "Error",
        "Please ensure all fields are filled before submitting votes.",
        [{ text: "OK", onPress: () => {} }]
      );
      return;
    }

    if (parsedData) {
      const registeredVoters = Number(parsedData.cpRegVoters);
      const congressmanTotalVotes = congressmanData.reduce((sum, candidate) => {
        const vote = votes[`${candidate.cdPos}-${candidate.cdName}`]; // FIXED
        const voteNumber = Number(vote);
        if (!isNaN(voteNumber) && Number.isInteger(voteNumber)) {
          return sum + voteNumber;
        }
        return sum;
      }, 0);

      if (!isNaN(registeredVoters)) {
        // ✅ Check congressman votes first
        if (congressmanTotalVotes > registeredVoters) {
          Alert.alert(
            "Vote Mismatch",
            `Total congressman votes (${congressmanTotalVotes}) exceed registered voters (${registeredVoters}).`,
            [{ text: "OK", onPress: () => {} }]
          );
          return;
        }

        // ✅ Now check each councillor vote individually
        for (const candidate of councillorData) {
          const vote = votes[`${candidate.cdPos}-${candidate.cdName}`]; // FIXED
          const voteNumber = Number(vote);

          if (voteNumber > registeredVoters) {
            Alert.alert(
              "Vote Mismatch",
              `Councillor ${candidate.cdName} has ${voteNumber} votes, which exceeds registered voters (${registeredVoters}).`,
              [{ text: "OK", onPress: () => {} }]
            );
            return;
          }
        }
      } else {
        Alert.alert("Error", "Invalid registered voters number in data.", [
          { text: "OK", onPress: () => {} },
        ]);
        return;
      }
    }

    const entries = allCandidates.map((candidate) => ({
      candidatePos: candidate.cdPos || "",
      candidateName: candidate.cdName || "",
      barangay: `${parsedData?.cpBarangay}`,
      cluster: `${parsedData?.cpCluster}`,
      voteCount: Math.floor(
        Number(votes[`${candidate.cdPos}-${candidate.cdName}`])
      ),
      encoderName: `${deviceData?.data?.deviceAssignedEncoder}`,
      regVoters: Number(parsedData?.cpRegVoters),
    }));

    setPreparedEntries(entries);
    setModalVisible(true);
  };

  const handleSubmitVote = async () => {
    if (!preparedEntries.length) return;

    if (!ballotsCast) {
      Alert.alert(
        "Error",
        "Missing ballot cast, please add ballot cast.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);
    const FormData = require("form-data");

    let data = new FormData();
    data.append("action", "voteCast");
    data.append("cpCluster", `${parsedData?.cpCluster}`);
    data.append("cpBarangay", `${parsedData?.cpBarangay}`);
    data.append("cpVoteCastOL", ballotsCast);

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://cleanfuel.com.ph/BCS2025/api/candidateVotes.php",
      headers: { "Content-Type": "multipart/form-data" },
      data: data,
    };

    try {
      const response = await axios.request(config);
      console.log(JSON.stringify(preparedEntries));
      if (
        response.data.Status === "1" &&
        response.data.Remarks === "Update successful"
      ) {
        const data = new FormData();
        data.append("action", "insertVotes");
        data.append("entries", JSON.stringify(preparedEntries));

        const config = {
          method: "post",
          maxBodyLength: Infinity,
          url: "https://cleanfuel.com.ph/BCS2025/api/candidateVotes.php",
          headers: { "Content-Type": "multipart/form-data" },
          data: data,
        };

        const response = await axios.request(config);

        console.log("This is handle submit", JSON.stringify(response.data));
        if (
          response.data.Status === "1" &&
          response.data.Remarks === "Successfully processed"
        ) {
          setModalVisible(false);
          setVotes({});
          router.replace("/(auth)/home");
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(auth)/home"); // fallback, or any route you want to go to
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.body}>
        <View style={styles.candidateContainer}>
          <Text style={styles.candidateHeader}>DETAILS</Text>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>{parsedData?.cpBarangay}</Text>
            <Text style={styles.detailsText}>
              CLUSTER {parsedData?.cpCluster} VOTERS {parsedData?.cpRegVoters}
            </Text>
          </View>
        </View>
        <View style={styles.candidateContainer}>
          <Text style={styles.candidateHeader}>BALLOTS CAST</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputCastBox}
              keyboardType="number-pad"
              value={ballotsCast}
              onChangeText={setBallotsCast}
            />
          </View>
        </View>
        <View style={styles.candidateContainer}>
          <Text style={styles.candidateHeader}>CONGRESSMAN</Text>
          {congressmanData && congressmanData.length > 0 && (
            <>
              {congressmanData.map((items, index) => (
                <View key={index} style={styles.inputContainer}>
                  <Text style={styles.inputText}>{items.cdName}</Text>
                  <TextInput
                    style={[
                      styles.inputBox,
                      errorInputs[`${items.cdPos}-${items.cdName}`] &&
                        styles.errorInput,
                    ]}
                    value={votes[`${items.cdPos}-${items.cdName}`] || ""}
                    keyboardType="number-pad"
                    onChangeText={(text: string) => {
                      setVotes((prev) => {
                        const newVotes = {
                          ...prev,
                          [`${items.cdPos}-${items.cdName}`]: text,
                        };
                        // Filter only congressman votes (cdPos === 'CG')
                        const congressmanVotes = Object.entries(newVotes)
                          .filter(([key]) => key.startsWith("CG-")) // Only keys that start with 'CG-'
                          .map(([, value]) => Number(value) || 0);

                        const totalCongressmanVotes = congressmanVotes.reduce(
                          (sum, val) => sum + val,
                          0
                        );

                        const regVoters = Number(parsedData?.cpRegVoters) || 0;

                        const newErrorInputs = { ...errorInputs };

                        if (totalCongressmanVotes > regVoters) {
                          newErrorInputs[`${items.cdPos}-${items.cdName}`] =
                            true;
                          Alert.alert(
                            "Warning",
                            `Total votes exceed the registered voters (${regVoters}).`,
                            [{ text: "OK" }]
                          );
                        } else {
                          newErrorInputs[`${items.cdPos}-${items.cdName}`] =
                            false;
                        }

                        setErrorInputs(newErrorInputs);
                        return newVotes;
                      });
                    }}
                  />
                </View>
              ))}
            </>
          )}
        </View>
        <View style={styles.candidateContainer}>
          <Text style={styles.candidateHeader}>COUNCILLOR</Text>
          {councillorData && councillorData.length && (
            <>
              {councillorData.map((items, index) => (
                <View key={index} style={styles.inputContainer}>
                  <Text style={styles.inputText}>{items.cdName}</Text>
                  <TextInput
                    style={[
                      styles.inputBox,
                      errorInputs[`${items.cdPos}-${items.cdName}`] &&
                        styles.errorInput,
                    ]}
                    value={votes[`${items.cdPos}-${items.cdName}`] || ""}
                    keyboardType="number-pad"
                    onChangeText={(text: string) => {
                      const numericVote = Number(text) || 0;
                      const regVoters = Number(parsedData?.cpRegVoters) || 0;

                      setVotes((prev) => ({
                        ...prev,
                        [`${items.cdPos}-${items.cdName}`]: text,
                      }));

                      const isError = numericVote > regVoters;

                      setErrorInputs((prev) => ({
                        ...prev,
                        [`${items.cdPos}-${items.cdName}`]: isError,
                      }));

                      // 👉 Only show alert IF there is an error
                      if (isError) {
                        Alert.alert(
                          "Warning",
                          `Vote for ${items.cdName} (${numericVote}) exceeds the registered voters of ${regVoters}.`,
                          [{ text: "OK" }]
                        );
                      }
                    }}
                  />
                </View>
              ))}
            </>
          )}
        </View>
        <TouchableOpacity
          onPress={prepareAndPreviewVote}
          style={styles.buttonSubmitContainer}
        >
          <Text style={styles.buttonSubmitText}>SUBMIT VOTES</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.headerContainer}>
              <AntDesign
                name="warning"
                size={50}
                color="orange"
                style={styles.iconModal}
              />
              <View style={styles.headerText}>
                <Text style={{ fontWeight: 800, fontSize: 16 }}>
                  Confirm submisison?
                </Text>
                <Text>
                  Once submitted, your votes will be recorded and cannot be
                  changed.
                </Text>
              </View>
            </View>
            <View style={styles.tableContainer}>
              <Text style={styles.tableColumn1}>CANDIDATES</Text>
              <Text style={styles.tableColumn2}>VOTES</Text>
            </View>
            {preparedEntries.map((entry, index) => (
              <View key={index} style={styles.tableContainer}>
                <Text style={styles.tableColumn1}>{entry?.candidateName}</Text>
                <Text style={styles.tableColumn2}>{entry?.voteCount}</Text>
              </View>
            ))}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buttonCancelModal}
                onPress={() => setModalVisible(!modalVisible)}
                disabled={loading}
              >
                <Text style={styles.buttonSubmitText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitVote}
                disabled={loading}
                style={styles.buttonSubmitModal}
              >
                <Text style={styles.buttonSubmitText}>
                  {loading ? "Loading..." : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    backgroundColor: "#E8E9EB",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "white",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backText: {
    fontSize: 20,
    fontWeight: "600",
  },
  body: {
    padding: 10,
  },
  detailsContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "auto",
  },
  detailsText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  candidateHeader: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  candidateContainer: {
    backgroundColor: "black",
    width: "100%",
    height: "auto",
    gap: 16,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 40,
  },
  inputText: {
    width: "65%",
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  inputBox: {
    width: "35%",
    height: 40,
    backgroundColor: "white",
    borderRadius: 10,
    fontSize: 13,
    paddingHorizontal: 8,
    borderWidth: 3,
    borderColor: "black",
    textAlignVertical: "center", // <-- Force text to center vertically
  },
  errorInput: {
    borderColor: "red", // Only change color on error
  },
  inputCastBox: {
    width: "100%",
    height: 40,
    backgroundColor: "white",
    borderRadius: 10,
    fontSize: 13,
    paddingHorizontal: 8,
    borderWidth: 3,
    borderColor: "black",
    textAlignVertical: "center",
  },
  buttonSubmitContainer: {
    width: "100%",
    height: 50,
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    borderRadius: 10,
  },
  buttonSubmitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    backgroundColor: "white",
    width: "80%",
    borderRadius: 5,
  },
  headerContainer: {
    width: "100%",
    padding: 20,
    flexDirection: "row",
  },
  headerText: {
    width: "75%",
    flexDirection: "column",
  },
  iconModal: {
    width: "25%",
    height: "auto",
  },
  tableContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 2,
  },
  tableColumn1: {
    width: "75%",
    fontSize: 16,
  },
  tableColumn2: {
    width: "25%",
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    padding: 20,
  },
  buttonCancelModal: {
    backgroundColor: "red",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonSubmitModal: {
    backgroundColor: "black",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
});
