import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Dimensions, Alert, ScrollView, FlatList, Linking, ActivityIndicator, RefreshControl } from "react-native";
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import getEnvVars from '../../../config/environment';
import { useAuth } from '../../contexts/authContext';
const { width, height } = Dimensions.get("window");
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';


const AddInward = ({ navigation }) => {
  const { API_URL } = getEnvVars();
  const { getAuthHeader, user } = useAuth(); // Add user from auth context
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [ProductDropdownVisible, setProductDropdownVisible] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [supplierDropdownVisible, setSupplierDropdownVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);


  // Update the formData state to match the supplier schema
  const [formData, setFormData] = useState({
    date: new Date(),
    source: '',
    destination: '',
    category: '',
    warehouse: '',
    amount: 0,
    gst: 0,
    totalAmount: 0,
    remarks: '',
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
      bagQuantity: 0,
      productRate: '',
      gstPercentage: '18', // Default GST percentage
      gstAmount: '0',      // GST amount for this product
      totalAmount: '0'     // Product total including GST
    }]
  });


 // Function to generate HTML content for the invoice
 const generateInvoiceHTML = (inwardData) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateSubtotal = (products = []) => {
    return products.reduce((total, product) => {
      const quantity = parseFloat(product.quantity) || 0;
      const rate = parseFloat(product.productRate) || 0;
      return total + (quantity * rate);
    }, 0).toFixed(2);
  };


// Ensure productDetails exists and is an array
const productDetails = inwardData.productDetails || [];
const subtotal = calculateSubtotal(productDetails);
const gst = (parseFloat(subtotal) * 0.18).toFixed(2); // 18% GST
const total = (parseFloat(subtotal) + parseFloat(gst)).toFixed(2);



return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
    <style>
      body {
        font-family: 'Helvetica';
        padding: 20px;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .company-name {
        font-size: 24px;
        font-weight: bold;
        color: #0CC0DF;
      }
      .invoice-details {
        margin-bottom: 20px;
      }
      .section {
        margin-bottom: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f5f5f5;
      }
      .total-section {
        text-align: right;
        margin-top: 20px;
      }
      .footer {
        margin-top: 50px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="company-name">Inward Receipt</div>
      <div>Invoice No: ${inwardData.invoiceNo || 'N/A'}</div>
      <div>Date: ${formatDate(inwardData.date)}</div>
    </div>

    <div class="section">
      <h3>Supplier Details</h3>
      <p>
        Name: ${inwardData.supplierDetails?.supplierName || 'N/A'}<br/>
        Mobile: ${inwardData.supplierDetails?.supplierMobileNo || 'N/A'}<br/>
        Email: ${inwardData.supplierDetails?.supplierEmailId || 'N/A'}<br/>
        GST No: ${inwardData.supplierDetails?.supplierGSTNo || 'N/A'}<br/>
        Address: ${inwardData.supplierDetails?.supplierAddress || 'N/A'}
      </p>
    </div>

    <div class="section">
      <h3>Transport Details</h3>
      <p>
        Vehicle Number: ${inwardData.transportDetails?.vehicleNumber || 'N/A'}<br/>
        Vehicle Type: ${inwardData.transportDetails?.vehicleType || 'N/A'}<br/>
        Driver Mobile: ${inwardData.transportDetails?.driverMobileNumber || 'N/A'}
      </p>
    </div>

    <div class="section">
      <h3>Product Details</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Code</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${productDetails.map(product => {
            const quantity = parseFloat(product.quantity) || 0;
            const rate = parseFloat(product.productRate) || 0;
            const amount = (quantity * rate).toFixed(2);
            return `
              <tr>
                <td>${product.name || 'N/A'}</td>
                <td>${product.productCode || 'N/A'}</td>
                <td>${quantity}</td>
                <td>₹${rate.toFixed(2)}</td>
                <td>₹${amount}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="total-section">
      <p>
        Subtotal: ₹${subtotal}<br/>
        GST (18%): ₹${gst}<br/>
        <strong>Total Amount: ₹${total}</strong>
      </p>
    </div>

    <div class="footer">
      <p>This is a computer-generated document. No signature required.</p>
    </div>
  </body>
</html>
`;
};


 // Function to generate and share PDF
 const generateAndSharePDF = async (inwardData) => {
  try {
    if (!inwardData || !inwardData.productDetails) {
      throw new Error('Invalid inward data');
    }

    // Generate PDF
    const html = generateInvoiceHTML(inwardData);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });

    // Share PDF
    if (Platform.OS === "ios") {
      await Sharing.shareAsync(uri);
    } else {
      // For Android, copy the file to a shared location
      const fileName = `invoice_${inwardData.invoiceNo || 'temp'}.pdf`;
      const destinationUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });

      return destinationUri;
    }

    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Function to send WhatsApp message with invoice
const sendWhatsAppMessage = async (inwardData, pdfUri) => {
  try {
    if (!inwardData?.supplierDetails?.supplierMobileNo) {
      throw new Error('Supplier mobile number not found');
    }

    const message = `Dear ${inwardData.supplierDetails.supplierName || 'Supplier'},\n\n`
      + `Your inward entry (Invoice No: ${inwardData.invoiceNo || 'N/A'}) has been processed.\n`
      + `Total Amount: ₹${inwardData.amount || '0'}\n`
      + `Date: ${new Date(inwardData.date).toLocaleDateString()}\n\n`
      + `Please find the attached invoice for your reference.`;

    const whatsappUrl = `whatsapp://send?phone=91${inwardData.supplierDetails.supplierMobileNo}&text=${encodeURIComponent(message)}`;
    
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    
    if (canOpen) {
      if (Platform.OS === 'android') {
        await Linking.openURL(whatsappUrl);
        
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Invoice PDF'
        });
      } else {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Invoice PDF'
        });
      }
    } else {
      throw new Error('WhatsApp is not installed on this device');
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};




// Function to send WhatsApp message with invoice


  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState('date');
  const [loading, setLoading] = useState(false);

  const categoryList = ["RM", "PM", "FG", "Third Party"];

  const calculateTotalAmount = (products) => {
    return products.reduce((total, product) => {
      const quantity = parseFloat(product.quantity) || 0;
      const rate = parseFloat(product.productRate) || 0;
      return total + (quantity * rate);
    }, 0).toFixed(2);
  };

  const handleCategoryChange = (category) => {
    setFormData({ ...formData, category });
  };

  const handleConfirmDate = (date) => {
    handleTransportInputChange('transportDate', date.toISOString());
    setDatePickerVisible(false);
  };

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

  const handleProductDetailsChange = (index, name, value) => {
    const updatedProducts = [...formData.productDetails];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [name]: value
    };

    if (name === 'productCode') {
      const filtered = products.filter(product =>
        product.productCode.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
    }

    // Calculate GST and total when quantity, rate, or GST percentage changes
    if (name === 'quantity' || name === 'productRate' || name === 'gstPercentage') {
      const quantity = parseFloat(updatedProducts[index].quantity) || 0;
      const rate = parseFloat(updatedProducts[index].productRate) || 0;
      const gstPercentage = parseFloat(updatedProducts[index].gstPercentage) || 0;
      
      // Calculate base amount (before GST)
      const baseAmount = quantity * rate;
      
      // Calculate GST amount
      const gstAmount = (baseAmount * gstPercentage) / 100;
      
      // Calculate total amount (including GST)
      const totalAmount = baseAmount + gstAmount;

      updatedProducts[index] = {
        ...updatedProducts[index],
        gstAmount: gstAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2)
      };

      // Calculate overall totals
      const overallGstAmount = updatedProducts.reduce((sum, product) => {
        return sum + parseFloat(product.gstAmount || 0);
      }, 0);

      const overallTotalAmount = updatedProducts.reduce((sum, product) => {
        return sum + parseFloat(product.totalAmount || 0);
      }, 0);

      // Update form data with correct totals
      setFormData(prevData => ({
        ...prevData,
        productDetails: updatedProducts,
        gst: overallGstAmount.toFixed(2),
        amount: overallTotalAmount.toFixed(2),
        totalAmount: overallTotalAmount.toFixed(2)
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        productDetails: updatedProducts
      }));
    }
  };


  const { supplierDetails } = formData;
  const handleProductSelect = (product, index) => {
    const updatedProducts = [...formData.productDetails];
    updatedProducts[index] = {
      ...updatedProducts[index],
      productId: product._id,
      productCode: product.productCode,
      name: product.productName,
      quantity: updatedProducts[index].quantity || '',
      productRate: product.productPrice?.toString() || ''
    };

    // Calculate total amount including GST for selected products
    const totalWithGst = updatedProducts.reduce((sum, p) => {
      return sum + parseFloat(p.totalAmount || 0);
    }, 0);

    setFormData(prevData => ({
      ...prevData,
      productDetails: updatedProducts,
      amount: totalWithGst.toFixed(2) // Store total with GST directly in amount
    }));

    setFilteredProducts([]);
  };

  const addProductDetail = () => {
    setFormData({
      ...formData,
      productDetails: [...formData.productDetails, {
        productId: '',
        quantity: '',
        name: '',
        productCode: '',
        bagQuantity: 0,
        productRate: '',
        gstPercentage: '18', // Default GST percentage
        gstAmount: '0',
        totalAmount: '0'
      }]
    });
  };

  const showDatePicker = () => {
    setMode('date');
    setShowPicker(true);
  };

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleTransportInputChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      transportDetails: { ...prevData.transportDetails, [name]: value }
    }));
  };

 // Update the handleSupplierDetailsChange function
 const handleSupplierDetailsChange = (name, value) => {
  setFormData((prevData) => ({
    ...prevData,
    supplierDetails: { 
      ...prevData.supplierDetails,
      [name]: value 
    }
  }));
};


  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch(`${API_URL}/api/warehouse/getAllWarehouse`);
        const data = await response.json();
        console.log("API Response:", data);

        setWarehouses(
          data.map((warehouse) => ({
            label: warehouse.warehouseName, // Use warehouseName instead of name
            value: warehouse.warehouseName,          // Use _id instead of id
          }))
        );
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      }
    };

    fetchWarehouses();
  }, []);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Suppliers/getAllSupplier`, {
          headers: {
            ...getAuthHeader(),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError("Response was not JSON");
        }

        const data = await response.json();
        console.log("Suppliers API Response:", data);
  
        setSuppliers(data); // Store the complete supplier objects
      } catch (error) {
        console.error("Error fetching Suppliers:", error);
        Alert.alert(
          'Error',
          'Failed to fetch suppliers. Please check your internet connection and try again.',
          [
            {
              text: 'Retry',
              onPress: () => fetchSupplier(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }
    };
  
    fetchSupplier();
  }, []);

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
    } = formData;

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

    if (!selectedSupplier) {
      return showError('Please select a Supplier');
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
    if (!supplierDetails.supplierName?.trim()) {
      Alert.alert('Validation Error', 'Please enter supplier name');
      return false;
    }

    if (!supplierDetails.supplierMobileNo?.trim()) {
      Alert.alert('Validation Error', 'Please enter supplier mobile number');
      return false;
    }

    if (!/^\d{10}$/.test(supplierDetails.supplierMobileNo)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number');
      return false;
    }

    if (!supplierDetails.supplierAddress?.trim()) {
      Alert.alert('Validation Error', 'Please enter supplier address');
      return false;
    }

    // Optional fields - only validate if they are provided
    if (supplierDetails.supplierGSTNo && supplierDetails.supplierGSTNo.length !== 15) {
      Alert.alert('Validation Error', 'GST Number must be exactly 15 characters long.');
      return false;
    }

    if (supplierDetails.supplierEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierDetails.supplierEmailId)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

   
  

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
    const totalAmount = parseFloat(formData.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return showError('Total amount must be greater than 0');
    }

    // Optional: Remarks validation if needed
    // if (remarks?.trim() && remarks.length > 500) {
    //   return showError('Remarks should not exceed 500 characters');
    // }

    return true;
  };

// Update the handleSubmit function
const handleSubmit = async () => {
  if (!validateForm()) return;

  setIsSubmitting(true);

  try {
    const requestPayload = {
      ...formData,
      supplierDetails: {
        ...formData.supplierDetails,
        supplierId: selectedSupplier?._id
      },
      warehouse: selectedWarehouse,
      gst: formData.gst,
      totalAmount: formData.amount
    };

    const response = await axios.post(
      `${API_URL}/api/inward/addInward`,
      requestPayload,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data) {
      Alert.alert('Success', 'Inward added successfully!');
      navigation.goBack();
    }
  } catch (error) {
    console.error('Error creating inward:', error);
    if (error.message === 'Your session has expired. Please login again.') {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please login again.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login');
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Failed to create inward. Please try again.');
    }
  } finally {
    setIsSubmitting(false);
  }
};



// Add a function to handle supplier selection
const handleSupplierSelect = (supplier) => {
  setSelectedSupplier(supplier);
  // Update the form data with the selected supplier's details
  setFormData(prevData => ({
    ...prevData,
    supplierDetails: {
      ...prevData.supplierDetails,
      supplierId: supplier._id,
      supplierName: supplier.supplierName || '',
      supplierMobileNo: supplier.supplierMobileNo || '',
      supplierGSTNo: supplier.supplierGSTNo || '',
      supplierAddress: supplier.supplierAddress || '',
      supplierEmailId: supplier.supplierEmailId || ''
    }
  }));
  setSupplierDropdownVisible(false);
};

  // Update the supplier dropdown section in the render part
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
      <View style={[styles.dropdownContainer, { position: 'relative', marginTop: 10 }]}>
        <ScrollView
          nestedScrollEnabled={true}
          style={[styles.dropdownScroll, { maxHeight: 300 }]}
          showsVerticalScrollIndicator={true}
        >
          {suppliers.map((supplier, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dropdownItem, { padding: 10 }]}
              onPress={() => {
                handleSupplierSelect(supplier);
                setSupplierDropdownVisible(false);
              }}
            >
              <Text style={styles.dropdownText}>{supplier.supplierName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )}
  </View>
);


// Update the renderSupplierDetails function to show selected supplier info
const renderSupplierDetails = () => (
  <>
    {renderSectionHeader("Supplier Details")}
    {renderSupplierDropdown()}
    {renderInputField({
      label: "Supplier Name",
      value: formData.supplierDetails.supplierName,
      onChangeText: (value) => handleSupplierDetailsChange("supplierName", value),
      placeholder: "Enter supplier name",
      editable: !selectedSupplier
    })}
    {renderInputField({
      label: "Mobile Number",
      value: formData.supplierDetails.supplierMobileNo,
      onChangeText: (value) => handleSupplierDetailsChange("supplierMobileNo", value),
      placeholder: "Enter 10-digit mobile number",
      keyboardType: "numeric",
      editable: !selectedSupplier
    })}
    {renderInputField({
      label: "GST Number",
      value: formData.supplierDetails.supplierGSTNo,
      onChangeText: (value) => handleSupplierDetailsChange("supplierGSTNo", value),
      placeholder: "Enter GST number",
      editable: !selectedSupplier
    })}
    {renderInputField({
      label: "Email",
      value: formData.supplierDetails.supplierEmailId,
      onChangeText: (value) => handleSupplierDetailsChange("supplierEmailId", value),
      placeholder: "Enter email address",
      keyboardType: "email-address",
      editable: !selectedSupplier
    })}
    {renderInputField({
      label: "Address",
      value: formData.supplierDetails.supplierAddress,
      onChangeText: (value) => handleSupplierDetailsChange("supplierAddress", value),
      placeholder: "Enter complete address",
      multiline: true,
      editable: !selectedSupplier
    })}
  </>
);
  const renderProductCodeInput = (product, index) => (
    <View style={[styles.inputContainer, { zIndex: 100 - index }]}>
      <Text style={styles.label}>Product Code</Text>
      <View style={styles.productInputWrapper}>
        <TextInput
          style={styles.input}
          value={product.productCode}
          onChangeText={(value) => handleProductDetailsChange(index, "productCode", value)}
          placeholder="Enter or search product code"
        />
        {filteredProducts.length > 0 && product.productCode && (
          <View style={styles.productSuggestions}>
            <FlatList
              nestedScrollEnabled
              data={filteredProducts}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item: prod }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleProductSelect(prod, index)}
                >
                  <Text style={styles.suggestionText}>
                    {prod.productCode}
                  </Text>
                  <Text style={styles.productInfo}>
                    {prod.productName} - {prod.measurementUnit || 'N/A'}
                  </Text>
                  <Text style={styles.priceText}>
                    Price: ₹{prod.productPrice}
                  </Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 200 }}
            />
          </View>
        )}
      </View>
    </View>
  );
  // Modify the date input field to include calendar icon
  const renderDateInput = () => (
    <TouchableOpacity
      style={styles.dateInputContainer}
      onPress={() => setDatePickerVisible(true)}
    >
      <Text style={styles.label}>Transport Date</Text>
      <View style={styles.dateWrapper}>
        <TextInput
          style={styles.dateInput}
          value={formData.date.toLocaleDateString()}
          placeholder="Select Transport Date"
          editable={false}
        />
        <FontAwesome
          name="calendar"
          size={24}
          color="#0CC0DF"
          style={styles.calendarIcon}
        />
      </View>
    </TouchableOpacity>
  );


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

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    
    // Fetch all necessary data
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch(`${API_URL}/api/product/getAllProducts`, {
          headers: getAuthHeader(),
        });
        const productsData = await productsResponse.json();
        setProducts(productsData);

        // Fetch warehouses
        const warehousesResponse = await fetch(`${API_URL}/api/warehouse/getAllWarehouse`);
        const warehousesData = await warehousesResponse.json();
        setWarehouses(
          warehousesData.map((warehouse) => ({
            label: warehouse.warehouseName,
            value: warehouse.warehouseName,
          }))
        );

        // Fetch suppliers
        const suppliersResponse = await fetch(`${API_URL}/api/Suppliers/getAllSupplier`, {
          headers: {
            ...getAuthHeader(),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData);

        setRefreshing(false);
      } catch (error) {
        console.error("Error refreshing data:", error);
        Alert.alert('Error', 'Failed to refresh data. Please try again.');
        setRefreshing(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#0CC0DF']}
          tintColor="#0CC0DF"
          progressBackgroundColor="#ffffff"
          size="large"
        />
      }
      showsVerticalScrollIndicator={true}
    >
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.dateContainer}>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.dateInput}
              value={formData.date.toLocaleDateString()}
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
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.label} className="top-2">Category</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={formData.category}
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
          value: formData.source,
          onChangeText: (value) => handleInputChange("source", value),
          placeholder: "Enter source location"
        })}
        {renderInputField({
          label: "Destination",
          value: formData.destination,
          onChangeText: (value) => handleInputChange("destination", value),
          placeholder: "Enter destination location"
        })}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Warehouse/Shop</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <View style={styles.inputRow}>
              <Text style={styles.selectedText}>
                {selectedWarehouse
                  ? warehouses.find((w) => w.value === selectedWarehouse)?.label
                  : "Select a warehouse/Shop"}
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

        {renderSectionHeader("Transport Details")}
        {renderInputField({
          label: "Driver Mobile Number",
          value: formData.transportDetails.driverMobileNumber,
          onChangeText: (value) => handleTransportInputChange("driverMobileNumber", value),
          placeholder: "Enter driver's mobile number",
          keyboardType: "numeric"
        })}
        {renderInputField({
          label: "Vehicle Type",
          value: formData.transportDetails.vehicleType,
          onChangeText: (value) => handleTransportInputChange("vehicleType", value),
          placeholder: "Enter vehicle type"
        })}
        {renderInputField({
          label: "Vehicle Number",
          value: formData.transportDetails.vehicleNumber,
          onChangeText: (value) => handleTransportInputChange("vehicleNumber", value),
          placeholder: "Enter vehicle number"
        })}

        {renderSupplierDetails()}

        {renderSectionHeader("Product Details")}
        {formData.productDetails.map((product, index) => (
          <View key={index} style={styles.productCard}>
            <Text style={styles.productIndex}>Product {index + 1}</Text>

            <View style={[styles.inputContainer, { zIndex: 100 - index }]}>
              <Text style={styles.label}>Product Code</Text>
              <TextInput
                style={styles.input}
                value={product.productCode}
                onChangeText={(value) => handleProductDetailsChange(index, "productCode", value)}
                placeholder="Enter or search product code ...."
              />

              {filteredProducts.length > 0 && product.productCode && (
                <View className="max-h-60 border border-gray-200 rounded-md bg-white">
                  <ScrollView nestedScrollEnabled={true} className="w-full">
                    {filteredProducts.map((prod, idx) => (
                      <TouchableOpacity
                        key={idx}
                        className="w-full px-4 py-2 border-b border-gray-100 active:bg-gray-100"
                        onPress={() => handleProductSelect(prod, index)}
                      >
                        <Text className="font-medium text-gray-800">
                          {prod.productCode}
                        </Text>
                        <Text className="text-sm text-gray-600">
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
              value: product.quantity,
              onChangeText: (value) => handleProductDetailsChange(index, "quantity", value),
              placeholder: "Enter quantity",
              keyboardType: "numeric"
            })}

            {renderInputField({
              label: "Product Rate",
              value: product.productRate,
              onChangeText: (value) => handleProductDetailsChange(index, "productRate", value),
              placeholder: "Enter product rate",
              keyboardType: "numeric"
            })}

            {renderInputField({
              label: "GST Percentage",
              value: product.gstPercentage,
              onChangeText: (value) => handleProductDetailsChange(index, "gstPercentage", value),
              placeholder: "Enter GST percentage",
              keyboardType: "numeric"
            })}

            {renderInputField({
              label: "GST Amount",
              value: `₹${product.gstAmount}`,
              placeholder: "GST amount will be calculated automatically",
              editable: false
            })}

            {renderInputField({
              label: "Total Amount (Including GST)",
              value: `₹${product.totalAmount}`,
              placeholder: "Total amount will be calculated automatically",
              editable: false
            })}

            {renderInputField({
              label: "Bag Quantity",
              value: product.bagQuantity?.toString(),
              onChangeText: (value) => handleProductDetailsChange(index, "bagQuantity", value),
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
            label: "GST Amount",
            value: `₹${formData.gst}`,
            placeholder: "GST will be calculated automatically",
            editable: false
          })}
          {renderInputField({
            label: "Total Amount (Including GST)",
            value: `₹${formData.amount}`,
            placeholder: "Final amount will be calculated automatically",
            editable: false
          })}
          {renderInputField({
            label: "Remarks",
            value: formData.remarks,
            onChangeText: (value) => handleInputChange("remarks", value),
            placeholder: "Enter remarks",
            multiline: true
          })}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: height * 0.1 }} />
      </View>
    </ScrollView>
  );
};

const styles = {
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
    marginLeft: 170,
  },
  container: {
    flex: 1,
    padding: width * 0.05,
    backgroundColor: '#f5f5f5'
  },
  header: {
    marginBottom: height * 0.03
  },
  headerTitle: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#0CC0DF'
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
    height: height * 0.06
  },
  pickerContainer: {
    marginBottom: height * 0.01
  },
  picker: {
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    backgroundColor: 'white',
    top: 5
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
    zIndex: 2000,
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
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    padding: width * 0.03,
    marginBottom: height * 0.02,
    backgroundColor: 'white'
  },
  dateText: {
    fontSize: width * 0.04,
    color: '#333'
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
  submitButtonDisabled: {
    backgroundColor: '#0CC0DF80', // Semi-transparent version of the button color
  },
  buttonText: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: 'bold'
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: '#fff',
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
};

const additionalStyles = {
  dateInputContainer: {
    marginBottom: height * 0.02,
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dateInput: {
    flex: 1,
    height: height * 0.06,
    paddingHorizontal: width * 0.03,
  },
  calendarIcon: {
    padding: width * 0.03,
  },
  productInputWrapper: {
    position: 'relative',
  },
  productSuggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    zIndex: 1000,
    maxHeight: height * 0.2,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  measurementUnit: {
    fontSize: width * 0.035,
    color: '#666',
    marginTop: 2,
  },
  ...additionalStyles,
};

export default AddInward;