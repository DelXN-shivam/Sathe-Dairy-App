import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../contexts/authContext";
import getEnvVars from "../../../config/environment";

const { API_URL } = getEnvVars();

const AddCustomer = () => {
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState({
    customerName: "",
    customerGSTNo: "",
    customerMobileNo: "",
    customerAddress: "",
    customerEmailId: "",
    customerBranchName: "",
    customerAccountNumber: "",
    customerIFSCCode: "",
    customerPanNumber: ""
  });

  const [errors, setErrors] = useState({});

  const validateFields = () => {
    let newErrors = {};

    // Validate required fields
    if (!customer.customerName) {
      newErrors.customerName = "Customer Name is required.";
    }

    if (!customer.customerMobileNo) {
      newErrors.customerMobileNo = "Mobile Number is required.";
    } else if (!/^\d{10}$/.test(customer.customerMobileNo)) {
      newErrors.customerMobileNo = "Mobile Number must be exactly 10 digits.";
    }

    if (!customer.customerAddress) {
      newErrors.customerAddress = "Address is required.";
    }

    // Optional fields - only validate if they are provided
    if (customer.customerGSTNo && customer.customerGSTNo.length !== 15) {
      newErrors.customerGSTNo = "GST Number must be exactly 15 characters long.";
    }

    if (customer.customerEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.customerEmailId)) {
      newErrors.customerEmailId = "Enter a valid email address.";
    }

    if (customer.customerIFSCCode && !/^[A-Z]{4}[0-9]{7}$/.test(customer.customerIFSCCode)) {
      newErrors.customerIFSCCode = "Invalid IFSC Code format.";
    }

    if (customer.customerPanNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(customer.customerPanNumber)) {
      newErrors.customerPanNumber = "Invalid PAN Number format.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCustomer = async () => {
    if (!validateFields()) {
      Alert.alert("Validation Error", "Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);

    try {
      // Make sure we're sending the exact field names the backend expects
      const customerData = {
        customerName: customer.customerName.trim(),
        customerGSTNo: customer.customerGSTNo.trim().toUpperCase(),
        customerMobileNo: customer.customerMobileNo.trim(),
        customerAddress: customer.customerAddress.trim(),
        customerEmailId: customer.customerEmailId.trim().toLowerCase(),
        customerBranchName: customer.customerBranchName.trim(),
        customerAccountNumber: customer.customerAccountNumber.trim(),
        customerIFSCCode: customer.customerIFSCCode.trim().toUpperCase(),
        customerPanNumber: customer.customerPanNumber.trim().toUpperCase()
      };
      
      const headers = {
        "Content-Type": "application/json",
        ...(getAuthHeader() || {})
      };

      // Make the API call
      const response = await fetch(`${API_URL}/api/customer/addCustomer`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(customerData),
      });
      
      let responseData = null;
      
      try {
        const responseText = await response.text();
        responseData = JSON.parse(responseText);
      } catch (err) {
        console.error("Error parsing response:", err);
      }

      if (response.ok) {
        Alert.alert(
          "Success", 
          "Customer added successfully.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        let errorMessage = "Failed to add customer.";
        
        if (responseData && responseData.message) {
          errorMessage = responseData.message;
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (response.status === 400) {
          errorMessage = "Invalid data format. Please check your inputs.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
        
        Alert.alert("Error", errorMessage);
        
        // If the error is likely due to a server issue, try an alternative approach
        if (response.status >= 500) {
          tryAlternativeEndpoint(customerData);
        }
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      Alert.alert("Connection Error", "Unable to connect to the server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const tryAlternativeEndpoint = async (customerData) => {
    try {
      setLoading(true);
      
      // Try a different endpoint structure
      const alternativeEndpoint = `${API_URL}/api/customers`;
      
      const response = await fetch(alternativeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthHeader() || {})
        },
        body: JSON.stringify(customerData),
      });
      
      if (response.ok) {
        Alert.alert(
          "Success", 
          "Customer added successfully using alternative method.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error("Error with alternative endpoint:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Customer</Text>

      {/* Basic Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Customer Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter customer name"
            value={customer.customerName}
            onChangeText={(text) => setCustomer({ ...customer, customerName: text })}
          />
          {errors.customerName && <Text style={styles.errorText}>{errors.customerName}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter GST number"
            value={customer.customerGSTNo}
            onChangeText={(text) => setCustomer({ ...customer, customerGSTNo: text.toUpperCase() })}
          />
          {errors.customerGSTNo && <Text style={styles.errorText}>{errors.customerGSTNo}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            keyboardType="numeric"
            maxLength={10}
            value={customer.customerMobileNo}
            onChangeText={(text) => setCustomer({ ...customer, customerMobileNo: text.replace(/[^0-9]/g, '') })}
          />
          {errors.customerMobileNo && <Text style={styles.errorText}>{errors.customerMobileNo}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={customer.customerEmailId}
            onChangeText={(text) => setCustomer({ ...customer, customerEmailId: text })}
          />
          {errors.customerEmailId && <Text style={styles.errorText}>{errors.customerEmailId}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter address"
            multiline={true}
            numberOfLines={3}
            value={customer.customerAddress}
            onChangeText={(text) => setCustomer({ ...customer, customerAddress: text })}
          />
          {errors.customerAddress && <Text style={styles.errorText}>{errors.customerAddress}</Text>}
        </View>
      </View>

      {/* Account Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Account Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bank and Branch Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter bank and branch name"
            value={customer.customerBranchName}
            onChangeText={(text) => setCustomer({ ...customer, customerBranchName: text })}
          />
          {errors.customerBranchName && <Text style={styles.errorText}>{errors.customerBranchName}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            keyboardType="numeric"
            value={customer.customerAccountNumber}
            onChangeText={(text) => setCustomer({ ...customer, customerAccountNumber: text.replace(/[^0-9]/g, '') })}
          />
          {errors.customerAccountNumber && <Text style={styles.errorText}>{errors.customerAccountNumber}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>IFSC Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter IFSC code"
            autoCapitalize="characters"
            value={customer.customerIFSCCode}
            onChangeText={(text) => setCustomer({ ...customer, customerIFSCCode: text.toUpperCase() })}
          />
          {errors.customerIFSCCode && <Text style={styles.errorText}>{errors.customerIFSCCode}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PAN Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter PAN number"
            autoCapitalize="characters"
            maxLength={10}
            value={customer.customerPanNumber}
            onChangeText={(text) => setCustomer({ ...customer, customerPanNumber: text.toUpperCase() })}
          />
          {errors.customerPanNumber && <Text style={styles.errorText}>{errors.customerPanNumber}</Text>}
        </View>
      </View>

      <TouchableOpacity 
        onPress={handleAddCustomer} 
        style={styles.submitButton} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Add Customer</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 20 }}></View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 15,
    color: "#555",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#0CC0DF",
    borderRadius: 10,
    paddingVertical: 15,
    marginHorizontal: 16,
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default AddCustomer;