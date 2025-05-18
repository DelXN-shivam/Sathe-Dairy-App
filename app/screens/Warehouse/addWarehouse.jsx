import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../contexts/authContext";
import getEnvVars from "../../../config/environment";
import { Ionicons } from "@expo/vector-icons";

const { API_URL } = getEnvVars();

const AddWarehouse = ({ navigation }) => {
  const { getAuthHeader } = useAuth();
  const [warehouse, setWarehouse] = useState({
    warehouseName: "",
    warehouseLocation: "",
    warehouseCapacity: "",
    managerName: "",
    managerContact: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!warehouse.warehouseName.trim()) {
      newErrors.warehouseName = "Warehouse name is required";
    } else if (warehouse.warehouseName.length > 50) {
      newErrors.warehouseName = "Warehouse name cannot exceed 50 characters";
    }
    
    if (!warehouse.warehouseLocation.trim()) {
      newErrors.warehouseLocation = "Warehouse location is required";
    } else if (warehouse.warehouseLocation.length > 100) {
      newErrors.warehouseLocation = "Location cannot exceed 100 characters";
    }
    
    if (!warehouse.warehouseCapacity.trim()) {
      newErrors.warehouseCapacity = "Warehouse capacity is required";
    } else if (isNaN(Number(warehouse.warehouseCapacity))) {
      newErrors.warehouseCapacity = "Warehouse capacity must be a valid number";
    } else if (Number(warehouse.warehouseCapacity) <= 0) {
      newErrors.warehouseCapacity = "Capacity must be greater than 0";
    }
    
    if (!warehouse.managerName.trim()) {
      newErrors.managerName = "Manager name is required";
    } else if (warehouse.managerName.length > 50) {
      newErrors.managerName = "Manager name cannot exceed 50 characters";
    } else if (!/^[a-zA-Z\s]*$/.test(warehouse.managerName)) {
      newErrors.managerName = "Manager name should only contain letters";
    }
    
    if (!warehouse.managerContact.trim()) {
      newErrors.managerContact = "Manager contact is required";
    } else if (!/^\d{10}$/.test(warehouse.managerContact)) {
      newErrors.managerContact = "Contact must be a 10-digit number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddWarehouse = async () => {
    try {
      if (!validateForm()) {
        Alert.alert("Validation Error", "Please fix the errors in the form.");
        return;
      }

      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/warehouse/addWarehouse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(warehouse),
      });

      if (response.ok) {
        const newWarehouse = await response.json();
        console.log("New Warehouse:", newWarehouse);
        Alert.alert("Success", "Warehouse added successfully.");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to add warehouse.");
      }
    } catch (error) {
      console.error("Error adding warehouse:", error);
      Alert.alert("Error", "Something went wrong while adding the warehouse.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (field, placeholder, keyboardType = "default", iconName, label) => (
    <View style={styles.inputContainer} key={field}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        errors[field] && styles.inputWrapperError
      ]}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={22} color="#0A9BC7" />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          keyboardType={keyboardType}
          value={warehouse[field]}
          onChangeText={(text) => {
            setWarehouse({ ...warehouse, [field]: text });
            if (errors[field]) {
              setErrors({ ...errors, [field]: null });
            }
          }}
        />
      </View>
      {errors[field] && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color="#FF5252" />
          <Text style={styles.errorText}>{errors[field]}</Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="p-4">
<Text className="text-2xl font-bold text-center text-black">Add New Warehouse</Text>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContent}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Warehouse Details</Text>
            {renderInput(
              "warehouseName", 
              "Enter warehouse name", 
              "default", 
              "business-outline",
              "Warehouse Name"
            )}
            {renderInput(
              "warehouseLocation", 
              "Enter warehouse location", 
              "default", 
              "location-outline",
              "Warehouse Location"
            )}
            {renderInput(
              "warehouseCapacity", 
              "Enter warehouse capacity", 
              "numeric", 
              "cube-outline",
              "Warehouse Capacity"
            )}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Manager Information</Text>
            {renderInput(
              "managerName", 
              "Enter manager name", 
              "default", 
              "person-outline",
              "Manager Name"
            )}
            {renderInput(
              "managerContact", 
              "Enter 10-digit contact number", 
              "phone-pad", 
              "call-outline",
              "Manager Contact"
            )}
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleAddWarehouse}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View style={styles.submitButtonContent}>
                <Ionicons name="add-circle-outline" size={24} color="white" />
                <Text style={styles.submitButtonText}>Add Warehouse</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f0f2f5" 
  },
  header: {
    backgroundColor: '#0A9BC7',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  headerIcon: {
    position: 'absolute',
    right: 20,
    top: 50,
  },
  formContainer: { 
    flex: 1 
  },
  formContent: { 
    padding: 20,
    paddingBottom: 40
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0A9BC7",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  inputContainer: { 
    marginBottom: 18
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#444",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputWrapperError: {
    borderColor: "#FF5252",
    borderWidth: 1,
  },
  iconContainer: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#eee",
    width: 50,
    alignItems: 'center',
  },
  input: { 
    flex: 1, 
    padding: 14, 
    fontSize: 16, 
    color: "#333" 
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 6,
  },
  errorText: { 
    color: "#FF5252", 
    fontSize: 12, 
    marginLeft: 4 
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#0A9BC7',
    shadowColor: "#0A9BC7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default AddWarehouse;