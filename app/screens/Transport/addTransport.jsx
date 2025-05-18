import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity , ScrollView, Dimensions} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import getEnvVars from "../../../config/environment";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useAuth } from "../../contexts/authContext"; // Import the AuthContext

const { width, height } = Dimensions.get("window");

const { API_URL } = getEnvVars();

const AddTransport = ({ navigation }) => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  // const [driverName, setDriverName] = useState("");
  // const [driverMobileNumber, setDriverMobileNumber] = useState("");
  // const [vehicleTemperature, setVehicleTemperature] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  // const [category, setCategory] = useState("");
  const [transactionType, setTransactionType] = useState("Inward"); // Default value
  // const [relatedActivity, setRelatedActivity] = useState("");
  // const [remarks, setRemarks] = useState("");
  const [rentalCost, setRentalCost] = useState(""); 
  const { getAuthHeader, userId } = useAuth(); // Get token management and userId from context
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [transportDate, setTransportDate] = useState(""); // State for transport date

  const validateForm = () => {
    // Vehicle Number validation (format: XX00XX0000)
    if (!vehicleNumber?.trim()) {
      Alert.alert('Error', 'Vehicle number is required.');
      return false;
    }
    
    const vehicleNumberPattern = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;
    if (!vehicleNumberPattern.test(vehicleNumber.trim())) {
      Alert.alert('Error', 'Vehicle number must follow the format XX00XX0000 (e.g., MH12AB1234).');
      return false;
    }
  
    // Vehicle Type validation
    if (!vehicleType?.trim()) {
      Alert.alert('Error', 'Vehicle type is required.');
      return false;
    }
  
    // Source validation
    if (!source?.trim()) {
      Alert.alert('Error', 'Source location is required.');
      return false;
    }
  
    // Destination validation
    if (!destination?.trim()) {
      Alert.alert('Error', 'Destination location is required.');
      return false;
    }
  
    // Source and Destination comparison
    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      Alert.alert('Error', 'Source and destination cannot be the same.');
      return false;
    }
  
    // Transaction Type validation
    if (!transactionType) {
      Alert.alert('Error', 'Please select a transaction type (Inward/Outward).');
      return false;
    }
  
    // Date validation
    if (!transportDate) {
      Alert.alert('Error', 'Please select a transport date.');
      return false;
    }
  
    // Validate that transport date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(transportDate) < today) {
      Alert.alert('Error', 'Transport date cannot be in the past.');
      return false;
    }
  
    // Rental Cost validation
    if (!rentalCost?.trim()) {
      Alert.alert('Error', 'Rental cost is required.');
      return false;
    }
  
    // Check if rental cost is a valid number
    const rentalCostNumber = Number(rentalCost);
    if (isNaN(rentalCostNumber) || rentalCostNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid rental cost (must be greater than 0).');
      return false;
    }
  
    return true;
  };

  const handleCreateTransport = async () => {
    if (!validateForm()) return;
    try {
      // Corrected the axios.post call by properly closing the object and moving the console.log statement
      const response = await axios.post(`${API_URL}/api/transport/addTransport`, 
        {
           vehicleNumber,
           vehicleType,
          //  driverName,
          //  driverMobileNumber,
          //  vehicleTemperature,
           source,
           destination,
          //  category,
           transactionType,
          //  relatedActivity,
          //  remarks,
           rentalCost,
           date: transportDate,
           userId
        },
        {
           headers: {
             ...getAuthHeader(),
             'Content-Type': 'application/json',
           }
        });
  
      // Moved console.log here to log the response data after the request
      console.warn("Transport Data:", response.data);
      
  
      Alert.alert("Success", "Transport record created successfully!");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create transport record. Please try again.");
    }
  };
  

  const handleConfirmDate = (date) => {
    setTransportDate(date.toISOString()); // Set the selected date to the transportDate state
    setDatePickerVisible(false);  // Close the date picker
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        placeholder="Vehicle Number"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        style={styles.input}
      />
      <TextInput
        placeholder="Vehicle Type"
        value={vehicleType}
        onChangeText={setVehicleType}
        style={styles.input}
      />
      {/* <TextInput
        placeholder="Driver Name"
        value={driverName}
        onChangeText={setDriverName}
        style={styles.input}
      /> */}
      {/* <TextInput
        placeholder="Driver Mobile Number"
        value={driverMobileNumber}
        onChangeText={setDriverMobileNumber}
        style={styles.input}
        keyboardType="phone-pad"
      /> */}
      {/* <TextInput
        placeholder="Vehicle Temperature"
        value={vehicleTemperature}
        onChangeText={setVehicleTemperature}
        style={styles.input}
        keyboardType="numeric"
      /> */}
      <TextInput
        placeholder="Source"
        value={source}
        onChangeText={setSource}
        style={styles.input}
      />
      <TextInput
        placeholder="Rental cost"
        value={rentalCost}  // Fixed the value reference
        onChangeText={setRentalCost}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Destination"
        value={destination}
        onChangeText={setDestination}
        style={styles.input}
      />
      {/* <TextInput
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      /> */}

      {/* Dropdown for Transaction Type */}
      <Text style={styles.label}>Transaction Type</Text>
      <Picker
        selectedValue={transactionType}
        onValueChange={(itemValue) => setTransactionType(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Inward" value="Inward" />
        <Picker.Item label="Outward" value="Outward" />
      </Picker>

      {/* <TextInput
        placeholder="Related Activity"
        value={relatedActivity}
        onChangeText={setRelatedActivity}
        style={styles.input}
      /> */}
      {/* <TextInput
        placeholder="Remarks"
        value={remarks}
        onChangeText={setRemarks}
        style={styles.input}
      /> */}

      {/* Date Picker for Transport Date */}
      <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
        <TextInput
          style={styles.datePickerInput}
          value={transportDate ? new Date(transportDate).toLocaleDateString() : ''}
          placeholder="Select Transport Date"
          editable={false}
        />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisible(false)}
      />

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCreateTransport}>
            
              <Text className="text-lg text-white font-bold">Create Transport</Text>
            </TouchableOpacity>

      <View className="h-16"></View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 20,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  datePickerInput: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    height: 50,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#0CC0DF',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
    width:width*0.9
  },
});

export default AddTransport;
