import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from "react-native";
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import getEnvVars from '../../../config/environment';
import { useAuth } from '../../contexts/authContext';
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width, height } = Dimensions.get("window");

const InwardUpdate = ({ route, navigation }) => {
  const { inwardId } = route.params;
  const { API_URL } = getEnvVars();
  const { getAuthHeader, userRole } = useAuth();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierDropdownVisible, setSupplierDropdownVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add fetchSuppliers function
  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Suppliers/getAllSupplier`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      console.log("Suppliers API Response:", data);
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching Suppliers:", error);
      Alert.alert('Error', 'Failed to fetch suppliers');
    }
  };
  const categoryList = ["KM", "PM", "FG"];

  const [updatedData, setUpdatedData] = useState({
    amount: '0',
    category: '',
    date: new Date(),
    destination: '',
    invoiceNo: '',
    remarks: '',
    source: '',
    warehouse: '',
    supplierDetails: {
      supplierId: '',
      supplierName: '',
      supplierMobileNo: '',
      supplierEmailId: '',
      supplierGSTNo: '',
      supplierAddress: ''
    },
    transportDetails: {
      vehicleNumber: '',
      vehicleType: '',
      driverMobileNumber: '',
      vehicleTemperature: ''
    },
    productDetails: [{
      productId: '',
      quantity: '',
      name: '',
      productCode: '',
      productRate: '',
      gstPercentage: '18',
      gstAmount: '0',
      totalAmount: '0',
      bagQuantity: '0'
    }]
  });


  // Calculate total amount
  const calculateTotalAmount = (products) => {
    return products.reduce((total, product) => {
      const quantity = parseFloat(product.quantity) || 0;
      const rate = parseFloat(product.productRate) || 0;
      return total + (quantity * rate);
    }, 0).toFixed(2);
  };

  // Fetch Inward data for update
  const fetchInwardData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/inward/getSingleInward/${inwardId}`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      console.log("Fetched Inward Data:", data);

      // Format the date
      const formattedDate = data.date ? new Date(data.date) : new Date();

      // Update the form data with all fields
      setUpdatedData({
        ...data,
        date: formattedDate,
        amount: String(data.amount || '0'),
        supplierDetails: {
          supplierId: data.supplierDetails?.supplierId || '',
          supplierName: data.supplierDetails?.supplierName || '',
          supplierMobileNo: data.supplierDetails?.supplierMobileNo || '',
          supplierEmailId: data.supplierDetails?.supplierEmailId || '',
          supplierGSTNo: data.supplierDetails?.supplierGSTNo || '',
          supplierAddress: data.supplierDetails?.supplierAddress || ''
        },
        productDetails: data.productDetails?.map(product => ({
          ...product,
          quantity: String(product.quantity || '0'),
          productRate: String(product.productRate || '0'),
          gstPercentage: String(product.gstPercentage || '18'),
          gstAmount: String(product.gstAmount || '0'),
          totalAmount: String(product.totalAmount || '0'),
          bagQuantity: String(product.bagQuantity || '0')
        })) || []
      });

      // Set selected warehouse
      if (data.warehouse) {
        setSelectedWarehouse(data.warehouse);
      }
    } catch (error) {
      console.error("Error fetching inward data:", error);
      Alert.alert("Error", "Failed to fetch inward data. Please try again.");
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/product/getAllProducts`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/warehouse/getAllWarehouse`, {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      
      setWarehouses(
        data.map((warehouse) => ({
          label: warehouse.warehouseName,
          value: warehouse.warehouseName,
        }))
      );
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  // Fetch all required data
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchInwardData(),
        fetchProducts(),
        fetchWarehouses(),
        fetchSuppliers()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load required data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to include all data fetching
  useEffect(() => {
    fetchAllData();
  }, [inwardId]);

  // Add supplier selection handler
  // Modified handleSupplierSelect to update supplier details correctly
  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierDropdownVisible(false);
    
    // Update all supplier details in the form state
    setUpdatedData(prevData => ({
      ...prevData,
      supplierDetails: {
        supplierName: supplier.supplierName || '',
        contactNumber: supplier.supplierMobileNo || '', // Changed from contactNumber to supplierMobileNo
          address: supplier.supplierAddress || '', // Changed from address to supplierAddress
        supplierId: supplier._id || ''
      }
    }));
  };



  // Add supplier dropdown renderer
  // Modified supplier dropdown renderer to show correct fields
  const renderSupplierDropdown = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Select Supplier</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setSupplierDropdownVisible(!supplierDropdownVisible)}
      >
        <View style={styles.inputRow}>
          <Text style={styles.selectedText}>
            {selectedSupplier ? selectedSupplier.supplierName : "Select a supplier"}
          </Text>
          <MaterialIcons 
            name={supplierDropdownVisible ? "arrow-drop-up" : "arrow-drop-down"} 
            size={24} 
          />
        </View>
      </TouchableOpacity>

      {supplierDropdownVisible && (
        <View style={styles.dropdownContainer}>
          <ScrollView
            nestedScrollEnabled={true}
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={true}
          >
            {suppliers.map((supplier) => (
              <TouchableOpacity
                key={supplier._id}
                style={styles.dropdownItem}
                onPress={() => handleSupplierSelect(supplier)}
              >
                <Text style={styles.dropdownText}>{supplier.supplierName}</Text>
                <Text style={styles.supplierInfo}>
                  {supplier.contactNumber} - {supplier.address}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );


  // Update the supplier details section in the render
  // Modified supplier details section renderer
  // Update renderSupplierDetails to show all supplier information
  const renderSupplierDetails = () => (
    <>
      {renderSectionHeader("Supplier Details")}
      
      {renderSupplierDropdown()}
      
      <View style={styles.supplierDetailsContainer}>
        {renderInputField({
          label: "Supplier Name",
          value: updatedData.supplierDetails.supplierName,
          onChangeText: (value) => handleInputChange("supplierName", value, "supplierDetails"),
          placeholder: "Enter supplier name"
        })}
        
        {renderInputField({
          label: "Mobile Number",
          value: updatedData.supplierDetails.supplierMobileNo,
          onChangeText: (value) => handleInputChange("supplierMobileNo", value, "supplierDetails"),
          placeholder: "Enter mobile number",
          keyboardType: "numeric"
        })}
        
        {renderInputField({
          label: "Email",
          value: updatedData.supplierDetails.supplierEmailId,
          onChangeText: (value) => handleInputChange("supplierEmailId", value, "supplierDetails"),
          placeholder: "Enter email address"
        })}
        
        {renderInputField({
          label: "GST Number",
          value: updatedData.supplierDetails.supplierGSTNo,
          onChangeText: (value) => handleInputChange("supplierGSTNo", value, "supplierDetails"),
          placeholder: "Enter GST number"
        })}
        
        {renderInputField({
          label: "Address",
          value: updatedData.supplierDetails.supplierAddress,
          onChangeText: (value) => handleInputChange("supplierAddress", value, "supplierDetails"),
          placeholder: "Enter address",
          multiline: true
        })}
      </View>
    </>
  );

  // Handle input changes in editable fields
  const handleInputChange = (field, value, section = '') => {
    if (section) {
      setUpdatedData(prevData => ({
        ...prevData,
        [section]: { ...prevData[section], [field]: value }
      }));
    } else {
      setUpdatedData(prevData => ({
        ...prevData,
        [field]: value
      }));
    }
  };

  // Handle product details change
  const handleProductChange = (index, field, value) => {
    setUpdatedData(prevData => {
      const updatedProducts = [...prevData.productDetails];
      updatedProducts[index] = { ...updatedProducts[index], [field]: value };
      
      // Calculate new amount whenever quantity or productRate changes
      if (field === 'quantity' || field === 'productRate') {
        const newAmount = calculateTotalAmount(updatedProducts);
        return { 
          ...prevData, 
          productDetails: updatedProducts,
          amount: newAmount
        };
      }
      
      return { 
        ...prevData, 
        productDetails: updatedProducts 
      };
    });
    
    // Filter products if product code is being searched
    if (field === 'productCode') {
      const filtered = products.filter(product =>
        product.productCode.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  // Handle product selection from dropdown
  const handleProductSelect = (product, index) => {
    setUpdatedData(prevData => {
      const updatedProducts = [...prevData.productDetails];
      updatedProducts[index] = {
        ...updatedProducts[index],
        productId: product._id,
        productCode: product.productCode,
        name: product.productName,
        quantity: updatedProducts[index].quantity || '0',
        productRate: product.productPrice?.toString() || '0'
      };
      
      const newAmount = calculateTotalAmount(updatedProducts);
      
      return {
        ...prevData,
        productDetails: updatedProducts,
        amount: newAmount
      };
    });
    
    setFilteredProducts([]);
  };

  // Add new product detail
  const addProductDetail = () => {
    setUpdatedData(prevData => ({
      ...prevData,
      productDetails: [
        ...prevData.productDetails,
        {
          productId: '',
          quantity: '0',
          name: '',
          productCode: '',
          bagQuantity: '0',
          productRate: '0'
        }
      ]
    }));
  };

  // Handle date confirmation
  const handleConfirmDate = (date) => {
    setUpdatedData(prevData => ({
      ...prevData,
      date
    }));
    setDatePickerVisible(false);
  };

  // Validate form before submission
  const validateForm = () => {
    // Helper function to show error alerts
    const showError = (message) => {
      Alert.alert('Validation Error', message);
      return false;
    };

    // Helper function to validate phone numbers
    const isValidPhoneNumber = (number) => {
      return /^[6-9]\d{9}$/.test(number);
    };

    // Helper function to validate vehicle number
    const isValidVehicleNumber = (number) => {
      // Format: XX00XX0000 (e.g., MH12AB1234)
      return /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/.test(number);
    };

    // Destructure form data for easier access
    const {
      source,
      destination,
      category,
      date,
      supplierDetails,
      transportDetails,
      productDetails,
      remarks
    } = updatedData;

    // 1. Basic Details Validation
    if (!source?.trim()) {
      return showError('Please enter a source location');
    }

    if (!destination?.trim()) {
      return showError('Please enter a destination location');
    }

    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      return showError('Source and destination cannot be the same');
    }

    if (!category) {
      return showError('Please select a category');
    }

    if (!selectedWarehouse) {
      return showError('Please select a warehouse');
    }

    // 2. Date Validation
    const currentDate = new Date();
    const selectedDate = new Date(date);

    if (!date) {
      return showError('Please select a date');
    }

    if (selectedDate > currentDate) {
      return showError('Date cannot be in the future');
    }

    // 3. Supplier Details Validation
    // if (!supplierDetails.name?.trim()) {
    //   return showError('Please enter supplier name');
    // }

    // if (!supplierDetails.contactNumber) {
    //   return showError('Please enter supplier contact number');
    // }

    // if (!isValidPhoneNumber(supplierDetails.contactNumber)) {
    //   return showError('Please enter a valid 10-digit mobile number starting with 6-9 for supplier');
    // }

    // if (!supplierDetails.address?.trim()) {
    //   return showError('Please enter supplier address');
    // }

    // if (supplierDetails.address.length < 10) {
    //   return showError('Supplier address should be at least 10 characters long');
    // }

    // 4. Transport Details Validation
    if (!transportDetails.driverMobileNumber) {
      return showError('Please enter driver mobile number');
    }

    if (!isValidPhoneNumber(transportDetails.driverMobileNumber)) {
      return showError('Please enter a valid 10-digit mobile number starting with 6-9 for driver');
    }

    if (!transportDetails.vehicleType?.trim()) {
      return showError('Please enter vehicle type');
    }

    if (!transportDetails.vehicleNumber?.trim()) {
      return showError('Please enter vehicle number');
    }

    if (!isValidVehicleNumber(transportDetails.vehicleNumber)) {
      return showError('Please enter a valid vehicle number in format XX00XX0000 (e.g., MH12AB1234)');
    }

    // 5. Product Details Validation
    if (!productDetails || productDetails.length === 0) {
      return showError('Please add at least one product');
    }

    for (let i = 0; i < productDetails.length; i++) {
      const product = productDetails[i];

      if (!product.productId) {
        return showError(`Please select a valid product for Product ${i + 1}`);
      }

      if (!product.productCode?.trim()) {
        return showError(`Please enter product code for Product ${i + 1}`);
      }

      if (!product.name?.trim()) {
        return showError(`Please enter product name for Product ${i + 1}`);
      }

      const quantity = parseFloat(product.quantity);
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        return showError(`Please enter a valid quantity greater than 0 for Product ${i + 1}`);
      }

      const rate = parseFloat(product.productRate);
      if (!rate || isNaN(rate) || rate <= 0) {
        return showError(`Please enter a valid rate greater than 0 for Product ${i + 1}`);
      }

      if (product.bagQuantity) {
        const bagQuantity = parseInt(product.bagQuantity);
        if (isNaN(bagQuantity) || bagQuantity < 0) {
          return showError(`Please enter a valid bag quantity (0 or greater) for Product ${i + 1}`);
        }
      }
    }

    // 6. Amount Validation
    const totalAmount = parseFloat(updatedData.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return showError('Total amount must be greater than 0');
    }

    return true;
  };

  // Handle update of Inward details
  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      if (!inwardId) {
        Alert.alert("Error", "Invalid Inward ID!");
        return;
      }

      setIsSubmitting(true);

      // Format the data for submission
      const formattedData = {
        ...updatedData,
        warehouse: selectedWarehouse,
        productDetails: updatedData.productDetails.map(product => ({
          ...product,
          bagQuantity: product.bagQuantity || '0',
          quantity: product.quantity || '0',
          productRate: product.productRate || '0'
        }))
      };

      console.log("Submitting data:", JSON.stringify(formattedData, null, 2));

      const response = await fetch(`${API_URL}/api/inward/updateInward/${inwardId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData),
      });

      // Log the response
      const responseText = await response.text();
      console.log('Response Status:', response.status);
      console.log('Response Body:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        Alert.alert('Error', 'Invalid response from server');
        return;
      }

      if (response.ok) {
        Alert.alert("Success", "Inward updated successfully!", [
          { text: "OK", onPress: () => navigation.navigate("InwardListing") }
        ]);
      } else {
        Alert.alert("Error", result.message || "Update failed. Please try again!");
      }
    } catch (error) {
      console.error("Error updating inward:", error);
      Alert.alert("Error", "Something went wrong. Please check your network connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render section header
  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // Render input field
  const renderInputField = ({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, editable = true }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && { height: height * 0.12, textAlignVertical: 'top' },
          !editable && { backgroundColor: '#f5f5f5' }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
      />
    </View>
  );

    if (userRole !== 'admin') { 
      Alert.alert('Access Denied', 'Only admin can view this page', [
        { text: 'OK', onPress: () => navigation.navigate("InwardDetail", { inwardId }) }
      ]);
      return null;
    }

  // Loading screen while fetching data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#0CC0DF" />
          <Text style={styles.loadingText}>Loading inward details...</Text>
        </View>
      </View>
    );
  }

  // Submitting overlay when updating
  const renderSubmittingOverlay = () => {
    if (!isSubmitting) return null;
    
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#0CC0DF" />
          <Text style={styles.loadingText}>Updating inward data...</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {renderSubmittingOverlay()}
      <ScrollView style={styles.container}>
        <Text className="text-lg font-extrabold p-2">Update Inward Transaction</Text>

        {/* Date Picker */}
        <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.dateContainer}>
          <Text style={styles.label}>Transport Date</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.dateInput}
              value={updatedData.date.toLocaleDateString()}
              placeholder="Select Transport Date"
              editable={false}
            />
            <Icon name="calendar-month" size={24} color="#0CC0DF" style={styles.icon} />
          </View>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisible(false)}
          date={updatedData.date}
        />

        {/* Category Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={updatedData.category}
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <Picker.Item label="Select Category" value="" />
              {categoryList.map((category, index) => (
                <Picker.Item key={index} label={category} value={category} />
              ))}
            </Picker>
          </View>
        </View>

        {renderSectionHeader("Basic Details")}
        
        {renderInputField({
          label: "Source",
          value: updatedData.source,
          onChangeText: (value) => handleInputChange("source", value),
          placeholder: "Enter source location"
        })}
        
        {renderInputField({
          label: "Destination",
          value: updatedData.destination,
          onChangeText: (value) => handleInputChange("destination", value),
          placeholder: "Enter destination location"
        })}

        {/* Warehouse Dropdown */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Warehouse</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <View style={styles.inputRow}>
              <Text style={styles.selectedText}>
                {selectedWarehouse
                  ? warehouses.find((w) => w.value === selectedWarehouse)?.label || selectedWarehouse
                  : "Select a warehouse"}
              </Text>
              <MaterialIcons name={dropdownVisible ? "arrow-drop-up" : "arrow-drop-down"} size={24} />
            </View>
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={styles.dropdownContainer}>
              <ScrollView
                nestedScrollEnabled={true}
                style={styles.dropdownScroll}
                showsVerticalScrollIndicator={true}
              >
                {warehouses.map((item) => (
                  <TouchableOpacity
                    key={item.value.toString()}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedWarehouse(item.value);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {renderSupplierDetails()}

        {renderSectionHeader("Transport Details")}
        
        {renderInputField({
          label: "Driver Mobile Number",
          value: updatedData.transportDetails.driverMobileNumber,
          onChangeText: (value) => handleInputChange("driverMobileNumber", value, "transportDetails"),
          placeholder: "Enter driver's mobile number",
          keyboardType: "numeric"
        })}
        
        {renderInputField({
          label: "Vehicle Type",
          value: updatedData.transportDetails.vehicleType,
          onChangeText: (value) => handleInputChange("vehicleType", value, "transportDetails"),
          placeholder: "Enter vehicle type"
        })}
        
        {renderInputField({
          label: "Vehicle Number",
          value: updatedData.transportDetails.vehicleNumber,
          onChangeText: (value) => handleInputChange("vehicleNumber", value, "transportDetails"),
          placeholder: "Enter vehicle number"
        })}

        {renderSectionHeader("Product Details")}
        
        {updatedData.productDetails.map((product, index) => (
          <View key={index} style={styles.productCard}>
            <Text style={styles.productIndex}>Product {index + 1}</Text>

            <View style={[styles.inputContainer, { zIndex: 100 - index }]}>
              <Text style={styles.label}>Product Code</Text>
              <TextInput
                style={styles.input}
                value={product.productCode}
                onChangeText={(value) => handleProductChange(index, "productCode", value)}
                placeholder="Enter or search product code"
              />

              {filteredProducts.length > 0 && product.productCode && (
                <View style={styles.productSuggestions}>
                  <ScrollView nestedScrollEnabled={true}>
                    {filteredProducts.map((prod, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => handleProductSelect(prod, index)}
                      >
                        <Text style={styles.suggestionText}>
                          {prod.productCode}
                        </Text>
                        <Text style={styles.productInfo}>
                          {prod.productName} - Price: ₹{prod.productPrice}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Product Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#f5f5f5' }]}
                value={product.name}
                editable={false}
                placeholder="Product name will appear here"
              />
            </View>

            {renderInputField({
              label: "Quantity",
              value: String(product.quantity),
              onChangeText: (value) => handleProductChange(index, "quantity", value),
              placeholder: "Enter quantity",
              keyboardType: "numeric"
            })}

            {renderInputField({
              label: "Product Rate",
              value: String(product.productRate),
              onChangeText: (value) => handleProductChange(index, "productRate", value),
              placeholder: "Enter product rate",
              keyboardType: "numeric"
            })}

            {renderInputField({
              label: "GST Percentage",
              value: String(product.gstPercentage),
              onChangeText: (value) => handleProductChange(index, "gstPercentage", value),
              placeholder: "Enter GST percentage",
              keyboardType: "numeric"
            })}

            {renderInputField({
              label: "GST Amount",
              value: `₹${product.gstAmount}`,
              editable: false,
              placeholder: "GST amount will be calculated"
            })}

            {renderInputField({
              label: "Total Amount",
              value: `₹${product.totalAmount}`,
              editable: false,
              placeholder: "Total amount will be calculated"
            })}

            {renderInputField({
              label: "Bag Quantity",
              value: String(product.bagQuantity),
              onChangeText: (value) => handleProductChange(index, "bagQuantity", value),
              placeholder: "Enter bag quantity",
              keyboardType: "numeric"
            })}
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addProductDetail}>
          <Text style={styles.buttonText}>+ Add Product</Text>
        </TouchableOpacity>

        <View style={styles.productCard}>
          {renderSectionHeader("Financial Details")}
          
          {renderInputField({
            label: "Base Amount",
            value: `₹${updatedData.amount}`,
            placeholder: "Amount will be calculated automatically",
            editable: false
          })}
          
          {renderInputField({
            label: "Total GST Amount",
            value: `₹${updatedData.productDetails.reduce((sum, product) => 
              sum + parseFloat(product.gstAmount || 0), 0).toFixed(2)}`,
            placeholder: "Total GST will be calculated automatically",
            editable: false
          })}
          
          {renderInputField({
            label: "Final Amount (Including GST)",
            value: `₹${updatedData.productDetails.reduce((sum, product) => 
              sum + parseFloat(product.totalAmount || 0), 0).toFixed(2)}`,
            placeholder: "Final amount will be calculated automatically",
            editable: false
          })}
          
          {renderInputField({
            label: "Remarks",
            value: updatedData.remarks,
            onChangeText: (value) => handleInputChange("remarks", value),
            placeholder: "Enter remarks",
            multiline: true
          })}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>

        <View style={{ height: height * 0.1 }} />
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: width * 0.05,
    backgroundColor: '#f5f5f5'
  },
  dateContainer: {
    marginBottom: height * 0.02
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  icon: {
    marginLeft: 10,
  },
  sectionHeader: {
    backgroundColor: '#0CC0DF',
    padding: width * 0.03,
    marginVertical: height * 0.02,
    borderRadius: 8
  },
  sectionTitle: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: 'bold'
  },
  inputContainer: {
    marginBottom: height * 0.02
  },
  label: {
    fontSize: width * 0.04,
    marginBottom: height * 0.01,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    padding: width * 0.03,
    backgroundColor: 'white',
    minHeight: height * 0.06
  },
  supplierInfo: {
    fontSize: width * 0.035,
    color: '#666',
    marginTop: 4
  },
  pickerContainer: {
    marginBottom: height * 0.02
  },
  picker: {
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  productCard: {
    backgroundColor: 'white',
    padding: width * 0.04,
    borderRadius: 8,
    marginBottom: height * 0.02,
    elevation: 2
  },
  productIndex: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: height * 0.02,
    color: '#0CC0DF'
  },
  productSuggestions: {
    position: 'absolute',
    top: height * 0.07,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    zIndex: 1000,
    maxHeight: height * 0.2,
  },
  suggestionItem: {
    padding: width * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: width * 0.04,
    color: '#333',
  },
  productInfo: {
    marginTop: height * 0.01,
    fontSize: width * 0.035,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#0CC0DF',
    padding: width * 0.04,
    borderRadius: 8,
    marginVertical: height * 0.02,
    alignItems: 'center'
  },
  submitButton: {
    backgroundColor: '#0CC0DF',
    padding: width * 0.04,
    borderRadius: 8,
    marginBottom: height * 0.02,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: 'bold'
  },
  dropdownContainer: {
    position: 'absolute',
    top: 85,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    backgroundColor: "#fff",
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 10,
  },
  selectedText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
};

export default InwardUpdate;