import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../contexts/authContext";
import getEnvVars from "../../../config/environment";

const { API_URL } = getEnvVars();

const AddSupplier = () => {
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [supplier, setSupplier] = useState({
    supplierName: "",
    supplierGSTNo: "",
    supplierMobileNo: "",
    supplierAddress: "",
    supplierEmailId: "",
    supplierAccountNumber: "",
    supplierBranchName: "",
    supplierIFSCode: "",
    supplierPanNumber: "",
  });

  const [errors, setErrors] = useState({});

  const validateFields = () => {
    let newErrors = {};

    if (!supplier.supplierName || supplier.supplierName.length < 3) {
      newErrors.supplierName = "Supplier Name must be at least 3 characters long.";
    }

    if (!supplier.supplierMobileNo || !/^\d{10}$/.test(supplier.supplierMobileNo)) {
      newErrors.supplierMobileNo = "Mobile Number must be exactly 10 digits.";
    }

    if (!supplier.supplierAddress || supplier.supplierAddress.length < 10) {
      newErrors.supplierAddress = "Address must be at least 10 characters long.";
    }

    // Optional fields - only validate if they are provided
    if (supplier.supplierGSTNo && supplier.supplierGSTNo.length !== 15) {
      newErrors.supplierGSTNo = "GST Number must be exactly 15 characters long.";
    }

    if (supplier.supplierEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.supplierEmailId)) {
      newErrors.supplierEmailId = "Enter a valid email address.";
    }

    if (supplier.supplierAccountNumber && !/^\d{9,18}$/.test(supplier.supplierAccountNumber)) {
      newErrors.supplierAccountNumber = "Account Number must be between 9 and 18 digits.";
    }
    
    if (supplier.supplierIFSCode && !/^[A-Z]{4}0\d{6}$/.test(supplier.supplierIFSCode)) {
      newErrors.supplierIFSCode = "Enter a valid IFSC Code (e.g., HDFC0001234).";
    }
    
    if (supplier.supplierPanNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(supplier.supplierPanNumber)) {
      newErrors.supplierPanNumber = "Enter a valid PAN Number (e.g., ABCDE1234F).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSupplier = async () => {
    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/Suppliers/addSupplier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(supplier),
      });

      const responseData = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Supplier added successfully!");
        navigation.goBack();
      } else {
        console.error("Server response:", responseData);
        Alert.alert(
          "Error", 
          responseData.message || "Failed to add supplier. Please try again."
        );
      }
    } catch (error) {
      console.error("Error adding supplier:", error);
      Alert.alert(
        "Error", 
        "Something went wrong while adding the supplier. Please check your internet connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Supplier</Text>

      {/* Basic Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Supplier Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter supplier name"
            value={supplier.supplierName}
            onChangeText={(text) => setSupplier({ ...supplier, supplierName: text })}
          />
          {errors.supplierName && <Text style={styles.errorText}>{errors.supplierName}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 15-digit GST number"
            maxLength={15}
            value={supplier.supplierGSTNo}
            onChangeText={(text) => setSupplier({ ...supplier, supplierGSTNo: text.toUpperCase() })}
          />
          {errors.supplierGSTNo && <Text style={styles.errorText}>{errors.supplierGSTNo}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit mobile number"
            keyboardType="numeric"
            maxLength={10}
            value={supplier.supplierMobileNo}
            onChangeText={(text) => setSupplier({ ...supplier, supplierMobileNo: text.replace(/[^0-9]/g, '') })}
          />
          {errors.supplierMobileNo && <Text style={styles.errorText}>{errors.supplierMobileNo}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            keyboardType="email-address"
            value={supplier.supplierEmailId}
            onChangeText={(text) => setSupplier({ ...supplier, supplierEmailId: text.trim() })}
          />
          {errors.supplierEmailId && <Text style={styles.errorText}>{errors.supplierEmailId}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter complete address"
            multiline={true}
            numberOfLines={3}
            value={supplier.supplierAddress}
            onChangeText={(text) => setSupplier({ ...supplier, supplierAddress: text })}
          />
          {errors.supplierAddress && <Text style={styles.errorText}>{errors.supplierAddress}</Text>}
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
            value={supplier.supplierBranchName}
            onChangeText={(text) => setSupplier({ ...supplier, supplierBranchName: text })}
          />
          {errors.supplierBranchName && <Text style={styles.errorText}>{errors.supplierBranchName}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            keyboardType="numeric"
            value={supplier.supplierAccountNumber}
            onChangeText={(text) => setSupplier({ ...supplier, supplierAccountNumber: text.replace(/[^0-9]/g, '') })}
          />
          {errors.supplierAccountNumber && <Text style={styles.errorText}>{errors.supplierAccountNumber}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>IFSC Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter IFSC code"
            value={supplier.supplierIFSCode}
            onChangeText={(text) => setSupplier({ ...supplier, supplierIFSCode: text.toUpperCase() })}
          />
          {errors.supplierIFSCode && <Text style={styles.errorText}>{errors.supplierIFSCode}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PAN Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter PAN number"
            value={supplier.supplierPanNumber}
            onChangeText={(text) => setSupplier({ ...supplier, supplierPanNumber: text.toUpperCase() })}
          />
          {errors.supplierPanNumber && <Text style={styles.errorText}>{errors.supplierPanNumber}</Text>}
        </View>
      </View>

      <TouchableOpacity 
        onPress={handleAddSupplier} 
        style={styles.submitButton} 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Add Supplier</Text>
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

export default AddSupplier;