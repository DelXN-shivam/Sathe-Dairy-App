import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker"; // Import Picker
import axios from "axios";
import getEnvVars from "../../../config/environment";

const { width } = Dimensions.get("window");
const { API_URL } = getEnvVars();

const EditTransport = ({ route, navigation }) => {
  const { id } = route.params;
  const [transport, setTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [selectedTransportType, setSelectedTransportType] = useState(null);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/transport/getSingleTransport/${id}`);
        setTransport(response.data);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch transport record.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransport();
  }, [id]);

  const validateForm = () => {
    // Check if transport object exists
    if (!transport) {
      Alert.alert('Error', 'Transport data is missing.');
      return false;
    }
  
    // Vehicle Number validation (format: XX00XX0000)
    if (!transport.vehicleNumber?.trim()) {
      Alert.alert('Error', 'Vehicle number is required.');
      return false;
    }
    
    const vehicleNumberPattern = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;
    if (!vehicleNumberPattern.test(transport.vehicleNumber.trim())) {
      Alert.alert('Error', 'Vehicle number must follow the format XX00XX0000 (e.g., MH12AB1234).');
      return false;
    }
  
    // Vehicle Type validation
    if (!transport.vehicleType?.trim()) {
      Alert.alert('Error', 'Vehicle type is required.');
      return false;
    }
  
    // Source validation
    if (!transport.source?.trim()) {
      Alert.alert('Error', 'Source location is required.');
      return false;
    }
  
    // Destination validation
    if (!transport.destination?.trim()) {
      Alert.alert('Error', 'Destination location is required.');
      return false;
    }
  
    // Transport Type dropdown validation
    if (!selectedTransportType) {
      Alert.alert('Error', 'Please select a transport type (Inward/Outward).');
      return false;
    }
  
    // Date validation
    if (!startDate) {
      Alert.alert('Error', 'Please select a date.');
      return false;
    }
  
    // Validate that start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      Alert.alert('Error', 'Start date cannot be in the past.');
      return false;
    }
  
    // Source and Destination comparison
    if (transport.source.trim().toLowerCase() === transport.destination.trim().toLowerCase()) {
      Alert.alert('Error', 'Source and destination cannot be the same.');
      return false;
    }
  
    return true;
  };
  const handleUpdateTransport = async () => {
    if (!validateForm()) return;
    try {
      await axios.patch(`${API_URL}/api/transport/updateTransport/${id}`, {
        ...transport,
        startDate,
        transportType: selectedTransportType,
      });
      Alert.alert("Success", "Transport record updated successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update transport record. Please try again.");
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0CC0DF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Transport</Text>

      {/* Date Selection */}
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateCard}>
          <Text style={styles.dateTitle}>
            Date: <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
          </Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}
      </View>

      {/* Form Inputs */}
      <TextInput
        placeholder="Vehicle Number"
        value={transport?.vehicleNumber}
        onChangeText={(text) => setTransport({ ...transport, vehicleNumber: text })}
        style={styles.input}
      />
      <TextInput
        placeholder="Vehicle Type"
        value={transport?.vehicleType}
        onChangeText={(text) => setTransport({ ...transport, vehicleType: text })}
        style={styles.input}
      />
      <TextInput
        placeholder="Source"
        value={transport?.source}
        onChangeText={(text) => setTransport({ ...transport, source: text })}
        style={styles.input}
      />
      <TextInput
        placeholder="Destination"
        value={transport?.destination}
        onChangeText={(text) => setTransport({ ...transport, destination: text })}
        style={styles.input}
      />

      
      {/* Transport Type Dropdown */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Transport Type:</Text>
        <Picker
          selectedValue={selectedTransportType}
          onValueChange={(itemValue) => setSelectedTransportType(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Transport Type" value={null} />
          <Picker.Item label="Outward" value="Outward" />
          <Picker.Item label="Inward" value="Inward" />
        </Picker>
      </View>

      {/* Update Button */}
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateTransport}>
        <Text style={styles.updateButtonText}>Update Transport</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textTransform: "uppercase",
  },
  dateRow: {
    marginBottom: 20,
  },
  dateCard: {
    width:width*0.9,
    marginHorizontal: 5,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 1,
    alignItems: "center",
  },
  dateTitle: {
    fontSize: 17,
    fontWeight: "medium",
    color: "#000",
    right:85
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "medium",
    color: "#0CC0DF",
  },
  pickerContainer: {
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
    elevation: 3,
    paddingHorizontal: 10,
  },
  pickerLabel: {
    fontSize: 16,
    color: "#000",
    marginVertical: 10,
    fontWeight: "bold",
  },
  picker: {
    height: 60,
    width: "100%",
  },
  input: {
    width: width * 0.9,
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    elevation: 3,
  },
  updateButton: {
    backgroundColor: "#0CC0DF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    width: width * 0.8,
    elevation: 3,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EditTransport;
