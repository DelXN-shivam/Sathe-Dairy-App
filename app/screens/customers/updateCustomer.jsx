import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../contexts/authContext";
import getEnvVars from "../../../config/environment";

const { API_URL } = getEnvVars();

const UpdateCustomer = () => {
  const route = useRoute();
  const { customerId } = route.params;
  const navigation = useNavigation();
  const { getAuthHeader, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [customer, setCustomer] = useState({
    customerId: "",
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

  useEffect(() => {
    if (!customerId) {
      console.error('Customer ID is missing');
      Alert.alert('Error', 'Customer ID is missing.');
      setIsFetching(false);
      return;
    }
    fetchCustomerDetails(customerId);
  }, [customerId]);

  const fetchCustomerDetails = async (id) => {
    setIsFetching(true);
    try {
      const response = await fetch(`${API_URL}/api/customer/getSingleCustomer/${id}`, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Map the received customer data to our state
        setCustomer({
          customerId: data.customer._id || "",
          customerName: data.customer.customerName || "",
          customerGSTNo: data.customer.customerGSTNo || "",
          customerMobileNo: data.customer.customerMobileNo || "",
          customerAddress: data.customer.customerAddress || "",
          customerEmailId: data.customer.customerEmailId || "",
          customerBranchName: data.customer.customerBranchName || "",
          customerAccountNumber: data.customer.customerAccountNumber || "",
          customerIFSCCode: data.customer.customerIFSCCode || "",
          customerPanNumber: data.customer.customerPanNumber || ""
        });
      } else {
        Alert.alert("Error", "Failed to fetch customer details.");
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
      Alert.alert("Error", "Something went wrong while fetching customer details.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!customer.customerId) {
      Alert.alert("Error", "Customer ID is required.");
      return;
    }

    // Validation for mobile number
    if (customer.customerMobileNo && !/^\d{10}$/.test(customer.customerMobileNo)) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/customer/updateCustomer/${customer.customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          customerName: customer.customerName,
          customerGSTNo: customer.customerGSTNo,
          customerMobileNo: customer.customerMobileNo,
          customerAddress: customer.customerAddress,
          customerEmailId: customer.customerEmailId,
          customerBranchName: customer.customerBranchName,
          customerAccountNumber: customer.customerAccountNumber,
          customerIFSCCode: customer.customerIFSCCode,
          customerPanNumber: customer.customerPanNumber
        }),
      });

      setIsLoading(false);

      if (response.ok) {
        Alert.alert("Success", "Customer updated successfully.");
        // Navigate to CustomerDetail page instead of going back
        navigation.navigate("CustomerDetail", { customerId: customer.customerId });
      } else {
        Alert.alert("Error", "Failed to update customer.");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error updating customer:", error);
      Alert.alert("Error", "Something went wrong while updating the customer.");
    }
  };

  if (userRole !== 'admin') { 
    Alert.alert('Access Denied', 'Only admin can view this page', [
      { text: 'OK', onPress: () => navigation.navigate("CustomerList") }
    ]);
    return null;
  }

  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0CC0DF" />
        <Text style={styles.loadingText}>Loading customer details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Update Customer</Text>

      {/* Basic Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter customer name"
            value={customer.customerName}
            onChangeText={(text) => setCustomer({ ...customer, customerName: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            keyboardType="numeric"
            value={customer.customerMobileNo}
            onChangeText={(text) => setCustomer({ ...customer, customerMobileNo: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            keyboardType="email-address"
            value={customer.customerEmailId}
            onChangeText={(text) => setCustomer({ ...customer, customerEmailId: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter address"
            multiline={true}
            value={customer.customerAddress}
            onChangeText={(text) => setCustomer({ ...customer, customerAddress: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter GST number"
            value={customer.customerGSTNo}
            onChangeText={(text) => setCustomer({ ...customer, customerGSTNo: text })}
          />
        </View>
      </View>

      {/* Account Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Account Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Branch Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter branch name"
            value={customer.customerBranchName}
            onChangeText={(text) => setCustomer({ ...customer, customerBranchName: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            keyboardType="numeric"
            value={customer.customerAccountNumber}
            onChangeText={(text) => setCustomer({ ...customer, customerAccountNumber: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>IFSC Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter IFSC code"
            value={customer.customerIFSCCode}
            onChangeText={(text) => setCustomer({ ...customer, customerIFSCCode: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PAN Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter PAN number"
            value={customer.customerPanNumber}
            onChangeText={(text) => setCustomer({ ...customer, customerPanNumber: text })}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleUpdateCustomer}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>Update Customer</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
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

export default UpdateCustomer;