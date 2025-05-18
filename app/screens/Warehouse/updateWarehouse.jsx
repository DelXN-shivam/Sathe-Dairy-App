import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useAuth } from "../../contexts/authContext";
import getEnvVars from "../../../config/environment";
import { Ionicons } from "@expo/vector-icons";

const { API_URL } = getEnvVars();

const UpdateWarehouse = ({ navigation }) => {
  const route = useRoute();
  const { getAuthHeader } = useAuth();
  const { id } = route.params;
  const [loading, setLoading] = useState(false);
  const [warehouse, setWarehouse] = useState({
    warehouseName: "",
    warehouseLocation: "",
    warehouseCapacity: "",
    managerName: "",
    managerContact: "",
  });
  const [errors, setErrors] = useState({});

  // Debug log for monitoring data
  const logWarehouseData = (stage, data) => {
    console.log(`[${stage}] Warehouse Data:`, data);
  };

  useEffect(() => {
    fetchWarehouseDetails();
  }, [id]);

  const fetchWarehouseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/warehouse/getSingleWarehouse/${id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        logWarehouseData('Fetched Data', data);
        
        // Ensure capacity is converted to string for TextInput
        const formattedData = {
          warehouseName: data.warehouseName || "",
          warehouseLocation: data.warehouseLocation || "",
          warehouseCapacity: data.warehouseCapacity ? data.warehouseCapacity.toString() : "",
          managerName: data.managerName || "",
          managerContact: data.managerContact || "",
        };
        
        logWarehouseData('Formatted Data', formattedData);
        setWarehouse(formattedData);
      } else {
        const errorData = await response.json();
        console.error('Fetch Error Response:', errorData);
        Alert.alert("Error", "Failed to fetch warehouse details.");
      }
    } catch (error) {
      console.error("Error fetching warehouse details:", error);
      Alert.alert("Error", "Something went wrong while fetching warehouse details.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!warehouse.warehouseName?.trim()) {
      newErrors.warehouseName = "Warehouse name is required";
    }

    if (!warehouse.warehouseLocation?.trim()) {
      newErrors.warehouseLocation = "Warehouse location is required";
    }

    if (!warehouse.warehouseCapacity) {
      newErrors.warehouseCapacity = "Warehouse capacity is required";
    } else {
      const capacity = parseInt(warehouse.warehouseCapacity, 10);
      if (isNaN(capacity) || capacity <= 0) {
        newErrors.warehouseCapacity = "Please enter a valid capacity";
      }
    }

    if (!warehouse.managerName?.trim()) {
      newErrors.managerName = "Manager name is required";
    }

    if (!warehouse.managerContact?.trim()) {
      newErrors.managerContact = "Manager contact is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateWarehouse = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      
      // Prepare data for update
      const updateData = {
        ...warehouse,
        warehouseCapacity: parseInt(warehouse.warehouseCapacity, 10),
      };
      
      logWarehouseData('Update Request Data', updateData);

      const response = await fetch(
        `${API_URL}/api/warehouse/updateWarehouse/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify(updateData),
        }
      );

      const responseData = await response.json();
      logWarehouseData('Update Response', responseData);

      if (response.ok) {
        Alert.alert(
          "Success",
          "Warehouse updated successfully.",
          [
            {
              text: "OK",
              onPress: () => {
                // Force refresh of the list screen by passing a timestamp
                navigation.navigate('warehouseList');
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", responseData.message || "Failed to update warehouse.");
      }
    } catch (error) {
      console.error("Error updating warehouse:", error);
      Alert.alert("Error", "Failed to update warehouse. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && Object.keys(warehouse).every(key => !warehouse[key])) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0CC0DF" />
        <Text style={styles.loadingText}>Loading warehouse details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Update Warehouse</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Warehouse Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Warehouse Name <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.warehouseName && styles.inputError]}
              placeholder="Enter warehouse name"
              value={warehouse.warehouseName}
              onChangeText={(text) => {
                setWarehouse({ ...warehouse, warehouseName: text });
                if (errors.warehouseName) setErrors({ ...errors, warehouseName: null });
              }}
            />
            {errors.warehouseName && (
              <Text style={styles.errorText}>{errors.warehouseName}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.warehouseLocation && styles.inputError]}
              placeholder="Enter warehouse location"
              value={warehouse.warehouseLocation}
              onChangeText={(text) => {
                setWarehouse({ ...warehouse, warehouseLocation: text });
                if (errors.warehouseLocation) setErrors({ ...errors, warehouseLocation: null });
              }}
            />
            {errors.warehouseLocation && (
              <Text style={styles.errorText}>{errors.warehouseLocation}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Capacity <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.warehouseCapacity && styles.inputError]}
              placeholder="Enter warehouse capacity"
              keyboardType="numeric"
              value={warehouse.warehouseCapacity}
              onChangeText={(text) => {
                setWarehouse({ ...warehouse, warehouseCapacity: text });
                if (errors.warehouseCapacity) setErrors({ ...errors, warehouseCapacity: null });
              }}
            />
            {errors.warehouseCapacity && (
              <Text style={styles.errorText}>{errors.warehouseCapacity}</Text>
            )}
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Manager Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Manager Name <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.managerName && styles.inputError]}
              placeholder="Enter manager name"
              value={warehouse.managerName}
              onChangeText={(text) => {
                setWarehouse({ ...warehouse, managerName: text });
                if (errors.managerName) setErrors({ ...errors, managerName: null });
              }}
            />
            {errors.managerName && (
              <Text style={styles.errorText}>{errors.managerName}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Manager Contact <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.managerContact && styles.inputError]}
              placeholder="Enter manager contact"
              keyboardType="numeric"
              value={warehouse.managerContact}
              onChangeText={(text) => {
                setWarehouse({ ...warehouse, managerContact: text });
                if (errors.managerContact) setErrors({ ...errors, managerContact: null });
              }}
              maxLength={10}
            />
            {errors.managerContact && (
              <Text style={styles.errorText}>{errors.managerContact}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdateWarehouse}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="save-outline" size={22} color="#fff" />
              <Text style={styles.buttonText}>Update Warehouse</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#2d3436",
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2d3436",
    textAlign: "center"
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    width: "100%",
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  requiredStar: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#FF5252",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#0CC0DF",
    width: "100%",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#93D5E1",
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
});

export default UpdateWarehouse;