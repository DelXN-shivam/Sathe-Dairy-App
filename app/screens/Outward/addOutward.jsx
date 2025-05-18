import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Dimensions, Alert, ScrollView, StyleSheet, ActivityIndicator} from "react-native";
// import { Picker } from '@react-native-picker/picker';
import getEnvVars from '../../../config/environment';
import { useAuth } from '../../contexts/authContext';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
// import { View, Text, TextInput, TouchableOpacity, Dimensions, Alert, ScrollView, StyleSheet } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { AntDesign } from '@expo/vector-icons';

const { API_URL } = getEnvVars();
const { width, height } = Dimensions.get("window");

const AddOutward = ({ navigation }) => {
  const { getAuthHeader } = useAuth();
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [status, setStatus] = useState("Pending");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState("Cash")
  const [deliveryStatus, setDeliveryStatus] = useState("Processing");
  const [outstandingPayment, setOutstandingPayment] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const categoryList = ["RM", "PM", "FG", "Third Party"];
  const [activeProductIndex, setActiveProductIndex] = useState(null);

  


  const removeProductDetail = (index) => {
    if (formData.productDetails.length > 1) {
      setFormData(prevData => ({
        ...prevData,
        productDetails: prevData.productDetails.filter((_, i) => i !== index)
      }));
    }
  };
  
  
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    category: '',
    rate: '',
    quantity: '',
    vehicleType: '',
    vehicleTemperature: '',
    bagQuantity: '',
    amount: '',
    // supplierContactDetails: '',
    invoiceNo: '',
    remarks: '',
    date: new Date(),
    total: '0',
    paymentType: 'Cash',
    outstandingPayment: 0,
    paymentStatus: 'Unpaid',
    productDetails: [{
      productId: '',
      quantity: '',
      name: '',
      productCode: '',
      productPrice: '',
      gstPercentage: '18', // Default GST percentage
      gstAmount: '0',      // GST amount for this product
      totalAmount: '0'     // Product total including GST
    }],
    transportDetails: {
      driverContactNumber: '',
      vehicleType: '',
      vehicleNumber: '',
      rentalCost: '',
      transportDate: '',
      driverName: ''
    },
    customerDetails: {
      customerId: '',
      name: '',
      contactNumber: '',
      address: '',
      customerEmailId: '',
      customerAddress: '',
    }
  });

  // New function to calculate total
  const calculateTotal = () => {
    console.log("=== CALCULATING TOTAL ===");
    console.log("Current form data:", JSON.stringify(formData, null, 2));
    
    // Calculate products total including GST
    let productTotal = 0;
    formData.productDetails.forEach((product, index) => {
      const totalAmount = parseFloat(product.totalAmount) || 0;
      console.log(`Product ${index + 1} total: ${totalAmount}`);
      productTotal += totalAmount;
    });
    console.log(`Total product amount: ${productTotal}`);

    // Add transport cost
    const rentalCost = parseFloat(formData.transportDetails.rentalCost) || 0;
    console.log(`Rental cost: ${rentalCost}`);
    
    // Calculate final total
    const total = productTotal + rentalCost;
    console.log(`Final total: ${total}`);

    // Update the form data with the new total
    setFormData(prev => {
      const updated = {
        ...prev,
        total: total.toFixed(2),
        amount: total.toFixed(2)
      };
      console.log("Updated form data with new total:", JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  // Function to manually trigger the calculation of the total
  const recalculateTotal = () => {
    console.log("=== MANUALLY RECALCULATING TOTAL ===");
    calculateTotal();
  };

  // Use effect to recalculate total whenever relevant values change
  useEffect(() => {
    console.log("=== FORM DATA CHANGED, RECALCULATING TOTAL ===");
    console.log("Product details:", JSON.stringify(formData.productDetails, null, 2));
    console.log("Transport details:", JSON.stringify(formData.transportDetails, null, 2));
    calculateTotal();
  }, [formData.productDetails, formData.transportDetails.rentalCost]);

  // Add a new useEffect to log form data changes for debugging
  useEffect(() => {
    console.log("=== FORM DATA UPDATED ===");
    console.log("Form data:", JSON.stringify(formData, null, 2));
  }, [formData]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/customer/getAllCustomer`, {
          headers: getAuthHeader(),
        });
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
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
    fetchProducts();
  }, []);

  const handleConfirmDate = (date) => {
    handleTransportInputChange('transportDate', date.toISOString());
    setDatePickerVisible(false);
  };

  const handleCustomerInputChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      customerDetails: { ...prevData.customerDetails, [name]: value }
    }));

    if (name === 'name') {
      const filtered = customers.filter(customer =>
        customer.customerName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  };

  const handleCustomerSelect = (customer) => {
    setFormData((prevData) => ({
      ...prevData,
      customerDetails: {
        customerId: customer._id,
        name: customer.customerName,
        contactNumber: customer.customerMobileNo,
        address: customer.customerGSTNo,
        customerEmailId: customer.customerEmailId || '',
        customerAddress: customer.customerAddress || '',
      }
    }));
    setFilteredCustomers([]);
  };

  const handleProductDetailsChange = (index, name, value) => {
    console.log(`=== CHANGING PRODUCT ${index + 1} ${name} TO ${value} ===`);
    
    const updatedProducts = [...formData.productDetails];
    
    // Update the specific field
    updatedProducts[index] = {
      ...updatedProducts[index],
      [name]: value
    };

    if (name === 'productCode') {
      setActiveProductIndex(index);
      const filtered = products.filter(product =>
        product.productCode.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
    }

    // Calculate GST and total when quantity, price, or GST percentage changes
    if (name === 'quantity' || name === 'productPrice' || name === 'gstPercentage') {
      // Get the current values after the update
      const quantity = parseFloat(updatedProducts[index].quantity) || 0;
      const price = parseFloat(updatedProducts[index].productPrice) || 0;
      const gstPercentage = parseFloat(updatedProducts[index].gstPercentage) || 0;

      console.log(`Recalculating for product ${index + 1}: quantity=${quantity}, price=${price}, gst=${gstPercentage}`);

      // Calculate base amount (before GST)
      const baseAmount = quantity * price;
      
      // Calculate GST amount
      const gstAmount = (baseAmount * gstPercentage) / 100;
      
      // Calculate total amount (including GST)
      const totalAmount = baseAmount + gstAmount;

      console.log(`Product ${index + 1} calculations: base=${baseAmount}, gst=${gstAmount}, total=${totalAmount}`);

      // Update the product with calculated values
      updatedProducts[index] = {
        ...updatedProducts[index],
        gstAmount: gstAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2)
      };
    }

    // Update the form data with the new product details
    setFormData(prevData => {
      const updated = {
        ...prevData,
        productDetails: updatedProducts
      };
      console.log("Updated form data after product details change:", JSON.stringify(updated, null, 2));
      return updated;
    });

    // Call calculateTotal after state update
    setTimeout(() => {
      console.log("Calling calculateTotal after product details change");
      calculateTotal();
    }, 100);
  };

  const handleProductSelect = (product, index) => {
    console.log(`=== SELECTING PRODUCT ${index + 1}: ${product.productName} ===`);
    console.log("Product details:", JSON.stringify(product, null, 2));
    
    const updatedProducts = [...formData.productDetails];
    updatedProducts[index] = {
      ...updatedProducts[index],
      productId: product._id,
      productCode: product.productCode,
      name: product.productName,
      productPrice: product.productPrice?.toString() || '0',
      quantity: '1',
      gstPercentage: '18', // Default GST percentage
      gstAmount: '0',
      totalAmount: '0'
    };

    // Calculate GST and total amount for the selected product
    const quantity = parseFloat(updatedProducts[index].quantity) || 0;
    const price = parseFloat(updatedProducts[index].productPrice) || 0;
    const gstPercentage = parseFloat(updatedProducts[index].gstPercentage) || 0;

    console.log(`Calculating for product ${index + 1}: quantity=${quantity}, price=${price}, gst=${gstPercentage}`);

    // Calculate base amount (before GST)
    const baseAmount = quantity * price;
    
    // Calculate GST amount
    const gstAmount = (baseAmount * gstPercentage) / 100;
    
    // Calculate total amount (including GST)
    const totalAmount = baseAmount + gstAmount;

    console.log(`Product ${index + 1} calculations: base=${baseAmount}, gst=${gstAmount}, total=${totalAmount}`);

    updatedProducts[index] = {
      ...updatedProducts[index],
      gstAmount: gstAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };

    // Update the form data with the new product details
    setFormData(prevData => {
      const updated = {
        ...prevData,
        productDetails: updatedProducts
      };
      console.log("Updated form data after product selection:", JSON.stringify(updated, null, 2));
      return updated;
    });
    
    setFilteredProducts([]);
    setActiveProductIndex(null); // Clear active index after selection
    
    // Call calculateTotal after state update
    setTimeout(() => {
      console.log("Calling calculateTotal after product selection");
      calculateTotal();
    }, 100);
  };


  const addProductDetail = () => {
    setFormData({
      ...formData,
      productDetails: [...formData.productDetails, {
        productId: '',
        quantity: '1',
        name: '',
        productCode: '',
        productPrice: '0',
        gstPercentage: '18', // Default GST percentage
        gstAmount: '0',
        totalAmount: '0'
      }]
    });
  };

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleTransportInputChange = (name, value) => {
    console.log(`=== CHANGING TRANSPORT ${name} TO ${value} ===`);
    
    setFormData((prevData) => {
      const updated = {
        ...prevData,
        transportDetails: { ...prevData.transportDetails, [name]: value }
      };
      console.log("Updated form data after transport change:", JSON.stringify(updated, null, 2));
      return updated;
    });
    
    // Recalculate total when rental cost changes
    if (name === 'rentalCost') {
      setTimeout(() => {
        console.log("Calling calculateTotal after rental cost change");
        calculateTotal();
      }, 100);
    }
  };

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateForm = () => {
    const { customerDetails, productDetails, transportDetails } = formData;
  
    // Validate customer details
    if (!customerDetails.name?.trim()) {
      Alert.alert('Error', 'Customer name is required.');
      return false;
    }

    // Validate customer email if provided
    if (customerDetails.customerEmailId && !emailRegex.test(customerDetails.customerEmailId)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return false;
    }
  
    if (customerDetails.contactNumber && !/^\d{10}$/.test(customerDetails.contactNumber)) {
      Alert.alert('Error', 'Customer contact number must be exactly 10 digits.');
      return false;
    }
  
    if (!customerDetails.address?.trim()) {
      Alert.alert('Error', 'Customer address is required.');
      return false;
    }
  
    // Validate transport details
    if (transportDetails.driverContactNumber && !/^\d{10}$/.test(transportDetails.driverContactNumber)) {
      Alert.alert('Error', 'Driver contact number must be exactly 10 digits.');
      return false;
    }
  
    // Validate vehicle number (format: XX00XX0000)
    if (transportDetails.vehicleNumber) {
      const vehicleNumberPattern = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;
      if (!vehicleNumberPattern.test(transportDetails.vehicleNumber)) {
        Alert.alert('Error', 'Vehicle number must follow the format XX00XX0000 (e.g., MH12AB1234).');
        return false;
      }
    }
  
    // Validate product details
    if (!productDetails || productDetails.length === 0) {
      Alert.alert('Error', 'At least one product is required.');
      return false;
    }
  
    for (let i = 0; i < productDetails.length; i++) {
      const product = productDetails[i];
      
      if (!product.productId) {
        Alert.alert('Error', `Product ${i + 1}: Please select a valid product.`);
        return false;
      }
  
      if (!product.quantity || isNaN(product.quantity) || parseFloat(product.quantity) <= 0) {
        Alert.alert('Error', `Product ${i + 1}: Quantity is required and must be greater than 0.`);
        return false;
      }
  
      if (!product.productPrice || isNaN(product.productPrice) || parseFloat(product.productPrice) <= 0) {
        Alert.alert('Error', `Product ${i + 1}: Product price is required and must be greater than 0.`);
        return false;
      }
    }
  
    // Validate basic details
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category.');
      return false;
    }
  
    if (!formData.source?.trim()) {
      Alert.alert('Error', 'Source is required.');
      return false;
    }
  
    if (!formData.destination?.trim()) {
      Alert.alert('Error', 'Destination is required.');
      return false;
    }
  
    // Validate payment details
    if (paymentStatus === "Partially Paid" && (!outstandingPayment || outstandingPayment <= 0)) {
      Alert.alert('Error', 'Please enter a valid outstanding payment amount.');
      return false;
    }
  
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!formData.customerDetails.name || formData.productDetails.some(p => !p.productId)) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Customer and Products)');
      return;
    }

    setIsSubmitting(true);

    const updatedFormData = {
      ...formData,
      outstandingPayment: outstandingPayment,
      paymentStatus: paymentStatus,
      deliveryStatus: deliveryStatus,
      status: status,
      paymentType: paymentType
    };

    try {
      const response = await fetch(`${API_URL}/api/outward/addoutward`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFormData),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Outward added successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error creating Outward document:', error);
      Alert.alert('Error', 'Failed to create outward document');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
<ScrollView style={styles.container}>
      <Text style={styles.header}>Add Outward</Text>

      {/* Category Section */}
      <View style={styles.card}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) => handleInputChange("category", value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Category" value="" />
            {categoryList.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
        </View>
      </View>

 {/* Update the Total field in Basic Details section to be read-only */}
 <View style={styles.card}>
        <Text style={styles.sectionHeader}>Basic Details</Text>
        {[
          { label: 'Source', name: 'source', placeholder: 'Ex. Source Warehouse/Shop' },
          { label: 'Destination', name: 'destination', placeholder: 'Ex. Destination Warehouse/Shop' },
          // { label: 'Rate', name: 'rate', placeholder: 'Ex. 60000', keyboardType: 'numeric' },
          // { label: 'Quantity', name: 'quantity', placeholder: 'Ex. 100', keyboardType: 'numeric' },
          // { label: 'Bag Quantity', name: 'bagQuantity', placeholder: 'Ex. 100', keyboardType: 'numeric' },
          { label: 'Remarks', name: 'remarks', placeholder: 'Ex. No remarks', multiline: true },
          // { 
          //   label: 'Total Amount', 
          //   name: 'total', 
          //   placeholder: '0.00',
          //   disabled: true,
          //   value: formData.total
          // }
        ].map((field, index) => (
          <View key={index} style={styles.inputContainer}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={[
                styles.input,
                field.disabled && styles.disabledInput,
                field.multiline && { height: height * 0.12 }
              ]}
              value={field.value || formData[field.name]}
              placeholder={field.placeholder}
              onChangeText={(value) => handleInputChange(field.name, value)}
              keyboardType={field.keyboardType || 'default'}
              multiline={field.multiline}
              editable={!field.disabled}
            />
          </View>
        ))}
      </View>

      {/* Transport Details Section */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Transport Details</Text>
        {[
          { key: 'rentalCost', label: 'Rental Cost', keyboardType: 'numeric' },
          { key: 'transportDate', label: 'Transport Date' },
          { key: 'driverName', label: 'Driver Name' },
          { key: 'vehicleNumber', label: 'Vehicle Number' },
          { key: 'vehicleType', label: 'Vehicle Type' },
          { key: 'driverContactNumber', label: 'Driver Contact Number', keyboardType: 'numeric' }
        ].map((field, index) => (
          <View key={index} style={styles.inputContainer}>
            <Text style={styles.label}>{field.label}</Text>
            {field.key === 'transportDate' ? (
              <>
                <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={formData.transportDetails[field.key]}
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
              </>
            ) : (
              <TextInput
                style={styles.input}
                value={formData.transportDetails[field.key]}
                placeholder={`Enter ${field.label}`}
                onChangeText={(value) => handleTransportInputChange(field.key, value)}
                keyboardType={field.keyboardType || 'default'}
              />
            )}
          </View>
        ))}
      </View>

      {/* Customer Details Section */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Customer Details</Text>
        
        {/* Full Name field with suggestions */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TouchableOpacity 
            style={styles.dropdownContainer}
            onPress={() => {
              // Show all customers when clicking the dropdown
              const filtered = customers.map(customer => customer);
              setFilteredCustomers(filtered);
            }}
          >
            <TextInput
              style={styles.dropdownInput}
              value={formData.customerDetails.name}
              placeholder="Enter Full Name"
              onChangeText={(value) => handleCustomerInputChange('name', value)}
            />
            <AntDesign 
              name="caretdown" 
              size={16} 
              color="#666"
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>
          
          {/* Scrollable Suggestions */}
          {filteredCustomers.length > 0 && (
            <ScrollView 
              style={[styles.suggestionContainer, styles.nameFieldSuggestions]}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCustomers.map((customer, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleCustomerSelect(customer)}
                  style={[
                    styles.suggestionItem,
                    index === filteredCustomers.length - 1 && styles.lastSuggestionItem
                  ]}
                >
                  <Text style={styles.suggestionText}>{customer.customerName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        
              {/* Rest of the customer details fields remain the same */}
              {[
          { key: 'contactNumber', label: 'Contact Number', keyboardType: 'numeric' },
          { key: 'address', label: 'GSTIN Number' },
          { key: 'customerEmailId', label: 'Email' },
          { key: 'customerAddress', label: 'Customer Address' },
        ].map((field, index) => (
          <View key={index} style={styles.inputContainer}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={formData.customerDetails[field.key]}
              placeholder={`Enter ${field.label}`}
              onChangeText={(value) => handleCustomerInputChange(field.key, value)}
              keyboardType={field.keyboardType || 'default'}
            />
          </View>
        ))}
      </View>

      {/* Product Details Section */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Product Details</Text>
        {formData.productDetails.map((product, index) => (
          <View key={index} style={styles.productCard}>
            <View style={styles.productHeaderContainer}>
        <Text style={styles.productIndexText}>Product #{index + 1}</Text>
        {formData.productDetails.length > 1 && (
          <TouchableOpacity
            onPress={() => removeProductDetail(index)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
       
            {/* Product Code Field with Fixed Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Product Code</Text>
              <View style={styles.dropdownWrapper}>
                <View style={styles.dropdownContainer}>
                  <TextInput
                    style={styles.dropdownInput}
                    value={product.productCode}
                    placeholder="Enter product code"
                    onChangeText={(value) => handleProductDetailsChange(index, 'productCode', value)}
                    onFocus={() => setActiveProductIndex(index)}
                  />
                  <AntDesign 
                    name="caretdown" 
                    size={16} 
                    color="#666"
                    style={styles.dropdownIcon}
                  />
                </View>

                {filteredProducts.length > 0 && activeProductIndex === index && (
  <View className="border border-gray-200 rounded-md bg-white shadow-sm max-h-48 w-full mt-1">
    <ScrollView 
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
      className="w-full"
    >
      {filteredProducts.map((prod, idx) => (
        <TouchableOpacity
          key={idx}
          onPress={() => handleProductSelect(prod, index)}
          className={`p-3 border-b border-gray-100 ${
            idx === filteredProducts.length - 1 ? 'border-b-0' : ''
          }`}
        >
          <Text className="text-gray-800">
            {prod.productCode} - {prod.productName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
              </View>
            </View>

            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={product.name}
              placeholder="Product name"
              editable={false}
            />

            <Text style={styles.label}>Product Price</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={product.productPrice ? product.productPrice.toString() : ''}
              placeholder="Product price"
              editable={false}
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={product.quantity ? product.quantity.toString() : ''}
              placeholder="Enter quantity"
              onChangeText={(value) => handleProductDetailsChange(index, 'quantity', value)}
              keyboardType="numeric"
            />

            <Text style={styles.label}>GST Percentage</Text>
            <TextInput
              style={styles.input}
              value={product.gstPercentage}
              placeholder="Enter GST percentage"
              onChangeText={(value) => handleProductDetailsChange(index, 'gstPercentage', value)}
              keyboardType="numeric"
            />

            <Text style={styles.label}>GST Amount</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={`₹${product.gstAmount || '0.00'}`}
              editable={false}
              placeholder="GST amount will be calculated"
            />

            <Text style={styles.label}>Total Amount (Inc. GST)</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={`₹${product.totalAmount || '0.00'}`}
              editable={false}
              placeholder="Total amount will be calculated"
            />
          </View>
        ))}

<TouchableOpacity onPress={addProductDetail} style={styles.addButton}>
    <Text style={styles.buttonText}>Add New Product</Text>
  </TouchableOpacity>
      </View>

      {/* Payment Details Section */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Payment Details</Text>
        
        {/* Add a clear display of the total amount with GST included */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Total Amount (including GST)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Total Amount"
            editable={false}
            value={`₹${formData.total || '0.00'}`}
          />
        </View>
        
        {/* Add a button to manually trigger the calculation of the total */}
        <TouchableOpacity 
          onPress={recalculateTotal} 
          style={styles.recalculateButton}
        >
          <Text style={styles.buttonText}>Calculate Total</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Payment Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={paymentStatus}
              onValueChange={(value) => {
                setPaymentStatus(value);
                if (value !== "Partially Paid") {
                  setOutstandingPayment(0);
                }
              }}
              style={styles.picker}
            >
              <Picker.Item label="Paid" value="Paid" />
              <Picker.Item label="Unpaid" value="Unpaid" />
              <Picker.Item label="Partially Paid" value="Partially Paid" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Payment Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={paymentType}
              onValueChange={(value) => setPaymentType(value)}
              style={styles.picker}
            >
              <Picker.Item label="Cheque" value="Cheque" />
              <Picker.Item label="Cash" value="Cash" />
              <Picker.Item label="Online" value="Online" />
              <Picker.Item label="Credit" value="Credit" />
            </Picker>
          </View>
        </View>

        {paymentStatus === "Partially Paid" && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Outstanding Payment</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={outstandingPayment.toString()}
              onChangeText={(value) => setOutstandingPayment(value === "" ? 0 : parseFloat(value))}
              placeholder="Enter outstanding payment"
            />
          </View>
        )}
      </View>

      <TouchableOpacity 
        onPress={handleSubmit} 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: height * 0.05 }} />
     
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
  },
  header: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#0CC0DF',
    marginBottom: height * 0.03,
  },
  sectionHeader: {
    fontSize: width * 0.06,
    fontWeight: '600',
    color: '#333',
    marginVertical: height * 0.02,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: height * 0.02,
  },
  label: {
    fontSize: width * 0.04,
    fontWeight: '500',
    color: '#666',
    marginBottom: height * 0.02
  },
  input: {
    borderWidth: 1,
    borderColor: '#0CC0DF',
    backgroundColor: '#fff',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    borderRadius: 8,
    height: height * 0.06,
    fontSize: width * 0.04,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: height * 0.02,
    overflow: 'hidden',
  },
  picker: {
    height: height * 0.07,
    backgroundColor: '#fff',
  },
  suggestionContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  button: {
    backgroundColor: '#0CC0DF',
    paddingVertical: height * 0.02,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  buttonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#0CC0DF',
    paddingVertical: height * 0.015,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: height * 0.02,
  },
  submitButton: {
    backgroundColor: '#0CC0DF',
    paddingVertical: height * 0.02,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: height * 0.03,
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0CC0DF',
    backgroundColor: '#fff',
    borderRadius: 8,
    height: height * 0.06,
  },
  dropdownInput: {
    flex: 1,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    fontSize: width * 0.04,
  },
  dropdownIcon: {
    paddingRight: width * 0.04,
  },
  suggestionContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    maxHeight: height * 0.2,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionItem: {
    padding: width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: width * 0.04,
    color: '#333',
  },
  nameFieldSuggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
  },

  productHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  productIndexText: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: width * 0.035,
    fontWeight: '500',
  },
  
  recalculateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: height * 0.015,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: height * 0.02,
  },
  
});
export default AddOutward;
