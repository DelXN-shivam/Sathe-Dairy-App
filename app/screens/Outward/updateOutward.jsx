import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, RefreshControl , ActivityIndicator} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import getEnvVars from '../../../config/environment';
import { useAuth } from '../../contexts/authContext';

const { API_URL } = getEnvVars();

const OutwardUpdate = ({ route, navigation }) => {
  const { outwardId } = route.params;
  const { getAuthHeader, userRole } = useAuth();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState(null);







    // Predefined category list
    const categories = [
      "KM", "PM", "FG"
    ];
    // const categoryList = ["KM", "PM", "FG"];

    const [updatedData, setUpdatedData] = useState({
      category: '',
      quantity: 0,
      total: 0,
      paymentType: 'Cash',
      outstandingPayment: '',
      invoiceGenerated: false,
      invoiceNo: '',
      source: '',
      destination: '',
      customerDetails: {
        customerId: '',
        name: '',
        contactNumber: '',
        address: '',
        customerAddress: '',
        customerEmailId: ''
      },
      productDetails: [{
        productId: '',
        quantity: 0,
        name: '',
        productCode: '',
        productPrice: 0
      }],
      transportDetails: {
        vehicleType: '',
        vehicleNumber: '',
        driverName: '',
        driverContactNumber: '',
        deliveryStatus: 'Pending',
        transportDate: new Date(),
        rentalCost: 0
      }
    });
  
    const paymentTypes = ["Cash", "Credit", "Online", "Cheque"];
    const deliveryStatuses = ["Pending", "Shipped", "Delivered"];
    const searchFields = [
      { label: "Category", value: "category" },
      { label: "Invoice No", value: "invoiceNo" },
      { label: "Customer Name", value: "customerDetails.name" },
      { label: "Product Code", value: "productDetails.productCode" }
    ];



    // 
    // Fetch products when the component mounts or when loading state changes
    // Fetch products from API
  const fetchProducts = async () => {
    setLoadingProducts(true);
    setProductError(null);
    try {
      const response = await fetch(`${API_URL}/api/product/getAllProducts`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setProductError('Failed to load products. Please try again.');
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Enhanced handleProductChange to auto-fill product details
  const handleProductChange = (index, field, value) => {
    setUpdatedData(prevData => {
      const updatedProducts = [...prevData.productDetails];
      
      if (field === 'productId') {
        // Find selected product
        const selectedProduct = products.find(p => p._id === value);
        if (selectedProduct) {
          // Auto-fill product details
          updatedProducts[index] = {
            ...updatedProducts[index],
            productId: selectedProduct._id,
            name: selectedProduct.productName,
            productCode: selectedProduct.productCode,
            productPrice: selectedProduct.sellingPrice || 0,
            quantity: updatedProducts[index].quantity || 1, // Maintain existing quantity or default to 1
            gstPercentage: 18 // Default GST percentage
          };
        }
      } else {
        // Handle other field changes normally
        updatedProducts[index] = { 
          ...updatedProducts[index], 
          [field]: value 
        };
      }

      // Calculate GST and total for the updated product
      const product = updatedProducts[index];
      if (product.quantity && product.productPrice && product.gstPercentage) {
        // Calculate base amount (before GST)
        const baseAmount = product.quantity * product.productPrice;
        
        // Calculate GST amount
        const gstAmount = (baseAmount * product.gstPercentage) / 100;
        
        // Calculate total amount (including GST)
        const totalAmount = baseAmount + gstAmount;

        updatedProducts[index] = {
          ...product,
          gstAmount: gstAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2)
        };
      }
      
      // Calculate overall totals
      const overallTotal = updatedProducts.reduce((sum, product) => {
        return sum + parseFloat(product.totalAmount || 0);
      }, 0);

      const overallGst = updatedProducts.reduce((sum, product) => {
        return sum + parseFloat(product.gstAmount || 0);
      }, 0);
      
      // Add transport cost to the total
      const transportCost = parseFloat(prevData.transportDetails.rentalCost) || 0;
      const finalTotal = overallTotal + transportCost;
      
      return { 
        ...prevData, 
        productDetails: updatedProducts,
        total: finalTotal.toFixed(2),
        amount: finalTotal.toFixed(2),
        gst: overallGst.toFixed(2)
      };
    });
  };

  // console.log(products)

  // Product Selection Component
  const ProductSelectionField = ({ product, index }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-lg border border-gray-100">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="bg-blue-100 w-8 h-8 rounded-full items-center justify-center mr-2">
            <Text className="text-blue-600 font-bold">{index + 1}</Text>
          </View>
          <Text className="font-semibold text-lg text-gray-800">Product Details</Text>
        </View>
        {updatedData.productDetails.length > 1 && (
          <TouchableOpacity
            onPress={() => removeProductDetail(index)}
            className="bg-red-100 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-red-600 font-medium">Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-600 mb-1">Select Product *</Text>
          {loadingProducts ? (
            <View className="bg-gray-50 p-3 rounded-lg">
              <ActivityIndicator size="small" color="#4F46E5" />
            </View>
          ) : productError ? (
            <View className="space-y-2">
              <Text className="text-red-500">{productError}</Text>
              <TouchableOpacity 
                onPress={fetchProducts}
                className="bg-blue-500 p-2 rounded-lg self-start"
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="border border-gray-200 rounded-lg overflow-hidden">
              <Picker
                selectedValue={product.productId}
                onValueChange={(value) => handleProductChange(index, 'productId', value)}
                className="bg-white"
              >
                <Picker.Item label="Select a product" value="" />
                {products.map((p) => (
                  <Picker.Item 
                    key={p._id} 
                    label={`${p.productName} (${p.productCode})`} 
                    value={p._id}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        <View className="grid grid-cols-2 gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1">Product Code</Text>
            <TextInput
              value={product.productCode}
              editable={false}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1">Unit Price</Text>
            <TextInput
              value={String(product.productPrice)}
              editable={false}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200"
            />
          </View>
        </View>

        <View className="grid grid-cols-2 gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1">Quantity *</Text>
            <TextInput
              value={String(product.quantity)}
              onChangeText={(text) => handleProductChange(index, 'quantity', parseInt(text) || 0)}
              className="bg-white p-3 rounded-lg border border-gray-200"
              placeholder="Enter Quantity"
              keyboardType="numeric"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1">GST %</Text>
            <TextInput
              value={String(product.gstPercentage || 18)}
              onChangeText={(text) => handleProductChange(index, 'gstPercentage', parseFloat(text) || 18)}
              className="bg-white p-3 rounded-lg border border-gray-200"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View className="grid grid-cols-2 gap-4">
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1">GST Amount</Text>
            <TextInput
              value={String(product.gstAmount || '0.00')}
              editable={false}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1">Total Amount</Text>
            <TextInput
              value={String(product.totalAmount || '0.00')}
              editable={false}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200"
            />
          </View>
        </View>
      </View>
    </View>
  );

  // Replace the existing Product Details section in the render method with:
  const ProductDetailsSection = () => (
    <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center">
          <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mr-3">
            <Text className="text-blue-600 text-lg font-bold">P</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-800">Product Details</Text>
        </View>
        <TouchableOpacity
          onPress={addProductDetail}
          className="bg-blue-500 px-5 py-2.5 rounded-lg flex-row items-center"
        >
          <Text className="text-white font-semibold mr-2">Add Product</Text>
          <Text className="text-white text-xl">+</Text>
        </TouchableOpacity>
      </View>

      {updatedData.productDetails.map((product, index) => (
        <ProductSelectionField 
          key={index} 
          product={product} 
          index={index} 
        />
      ))}
    </View>
  );




     // Refresh control
  // const onRefresh = React.useCallback(() => {
  //   setRefreshing(true);
  //   fetchOutwardData().finally(() => setRefreshing(false));
  // }, []);

  // Calculate total and outstanding payment
  const calculateAmounts = () => {
    // Calculate products total only
    const productsTotal = updatedData.productDetails.reduce((sum, product) => {
      return sum + ((parseFloat(product.productPrice) || 0) * (parseInt(product.quantity) || 0));
    }, 0);
    
    // Add transport cost
    const transportCost = parseFloat(updatedData.transportDetails.rentalCost) || 0;
    const total = productsTotal + transportCost;
    
    // Only update total, leave outstanding payment unchanged
    // handleInputChange('total', total);
  };

// Update useEffect to not affect outstanding payment
useEffect(() => {
  calculateAmounts();
}, [updatedData.productDetails, updatedData.transportDetails.rentalCost]);

// Simplify handleInputChange to not modify outstanding payment
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

  // Search functionality
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredData(null);
      return;
    }

    const searchValue = text.toLowerCase();
    const getValue = (obj, path) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const filtered = getValue(updatedData, searchField)?.toString().toLowerCase().includes(searchValue);
    setFilteredData(filtered ? updatedData : null);
  };


  // Date picker with calendar icon
  const DatePickerField = ({ value, onChange }) => (
    <View className="flex-row items-center">
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="flex-1 flex-row items-center justify-between p-2 border border-gray-300 rounded-md"
      >
        <Text>{new Date(value).toLocaleDateString()}</Text>
        <Calendar className="w-5 h-5 text-gray-500" />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={new Date(value)}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      )}
    </View>
  );


  // Enhanced validation functions based on schema requirements
  const validateContactNumber = (number) => {
    return /^\d{10}$/.test(number);
  };

  const validateVehicleNumber = (number) => {
    return /^[A-Z0-9-]{5,15}$/.test(number);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateRequiredFields = () => {
    const requiredFields = {
      category: 'Category',
      source: 'Source',
      destination: 'Destination',
      'customerDetails.name': 'Customer Name',
      'customerDetails.contactNumber': 'Customer Contact Number',
      'customerDetails.address': 'Customer Address',
      'customerDetails.customerAddress': 'Customer Delivery Address',
      'customerDetails.customerEmailId': 'Customer Email',
      'transportDetails.vehicleType': 'Vehicle Type',
      'transportDetails.vehicleNumber': 'Vehicle Number',
      'transportDetails.driverName': 'Driver Name',
      'transportDetails.driverContactNumber': 'Driver Contact Number'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj[key], updatedData)
        : updatedData[field];
      
      if (!value || value.toString().trim() === '') {
        Alert.alert('Validation Error', `${label} is required`);
        return false;
      }
    }

    return true;
  };

  // const handleInputChange = (field, value, section = '') => {
  //   if (section) {
  //     setUpdatedData(prevData => ({
  //       ...prevData,
  //       [section]: { ...prevData[section], [field]: value }
  //     }));
  //   } else {
  //     setUpdatedData(prevData => ({
  //       ...prevData,
  //       [field]: value
  //     }));
  //   }
  // };



  const calculateTotal = () => {
    const productsTotal = updatedData.productDetails.reduce((sum, product) => {
      const baseAmount = (parseFloat(product.productPrice) || 0) * (parseInt(product.quantity) || 0);
      const gstAmount = (baseAmount * (parseFloat(product.gstPercentage) || 18)) / 100;
      return sum + (baseAmount + gstAmount);
    }, 0);
    
    const transportCost = parseFloat(updatedData.transportDetails.rentalCost) || 0;
    const total = productsTotal + transportCost;
    
    setUpdatedData(prevData => ({
      ...prevData,
      total: total.toFixed(2),
      amount: total.toFixed(2)
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [updatedData.productDetails, updatedData.transportDetails.rentalCost]);

  const addProductDetail = () => {
    setUpdatedData(prevData => ({
      ...prevData,
      productDetails: [...prevData.productDetails, {
        productId: '',
        quantity: 0,
        name: '',
        productCode: '',
        productPrice: 0
      }]
    }));
  };

  const removeProductDetail = (index) => {
    if (updatedData.productDetails.length > 1) {
      setUpdatedData(prevData => ({
        ...prevData,
        productDetails: prevData.productDetails.filter((_, i) => i !== index)
      }));
    }
  };

  const fetchOutwardData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/outward/getSingleOutward/${outwardId}`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) throw new Error('Failed to fetch outward data');
      
      const data = await response.json();
      setUpdatedData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch outward data');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOutwardData();
  }, [outwardId]);

  const validateForm = () => {
    if (!validateRequiredFields()) return false;
    
    if (!validateContactNumber(updatedData.customerDetails.contactNumber)) {
      Alert.alert('Error', 'Please enter a valid customer contact number');
      return false;
    }
    if (!validateEmail(updatedData.customerDetails.customerEmailId)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!validateVehicleNumber(updatedData.transportDetails.vehicleNumber)) {
      Alert.alert('Error', 'Please enter a valid vehicle number (5-15 characters, uppercase letters, numbers, and hyphens only)');
      return false;
    }
    if (!validateContactNumber(updatedData.transportDetails.driverContactNumber)) {
      Alert.alert('Error', 'Please enter a valid driver contact number');
      return false;
    }
    
    // Validate product details
    if (!updatedData.productDetails.every(product => 
      product.productId && 
      product.productCode && 
      product.quantity > 0 && 
      product.productPrice >= 0
    )) {
      Alert.alert('Error', 'Please fill all product details correctly');
      return false;
    }
    
    return true;
  };

  const handleUpdate = async () => {
    try {
      if (!validateForm()) return;
      
      const response = await fetch(`${API_URL}/api/outward/updateOutward/${outwardId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Update failed');
        return;
      }

      Alert.alert('Success', 'Outward updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      Alert.alert('Error', 'Failed to update outward. Please try again.');
      console.error(error);
    }
  };

console.log(updatedData);

    if (userRole !== 'admin') { 
      Alert.alert('Access Denied', 'Only admin can view this page', [
        { text: 'OK', onPress: () => navigation.navigate("OutwardDetail", { outwardId }) }
      ]);
      return null;
    }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4 space-y-6">
        {/* Header Section */}
        <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mr-3">
                <Text className="text-blue-600 text-xl font-bold">O</Text>
              </View>
              <View>
                <Text className="text-2xl font-bold text-gray-800">Update Outward</Text>
                <Text className="text-gray-500">Invoice No: {updatedData.invoiceNo}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Basic Information Section */}
        <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center mb-6">
            <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mr-3">
              <Text className="text-blue-600 text-lg font-bold">B</Text>
            </View>
            <Text className="text-xl font-bold text-gray-800">Basic Information</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-600 mb-1">Category *</Text>
              <View className="border border-gray-200 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={updatedData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  className="bg-white"
                >
                  <Picker.Item label="Select Category" value="" />
                  {categories.map((category) => (
                    <Picker.Item key={category} label={category} value={category} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Source Location *</Text>
                <TextInput
                  value={updatedData.source}
                  onChangeText={(text) => handleInputChange('source', text)}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Source Location"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Destination *</Text>
                <TextInput
                  value={updatedData.destination}
                  onChangeText={(text) => handleInputChange('destination', text)}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Destination"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-600 mb-1">Payment Type *</Text>
              <View className="border border-gray-200 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={updatedData.paymentType}
                  onValueChange={(value) => handleInputChange('paymentType', value)}
                  className="bg-white"
                >
                  {paymentTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Details Section */}
        <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center mb-6">
            <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mr-3">
              <Text className="text-blue-600 text-lg font-bold">C</Text>
            </View>
            <Text className="text-xl font-bold text-gray-800">Customer Details</Text>
          </View>

          <View className="space-y-4">
            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Name</Text>
                <TextInput
                  value={updatedData.customerDetails.name}
                  onChangeText={(text) => handleInputChange('name', text, 'customerDetails')}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Customer Name"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Email</Text>
                <TextInput
                  value={updatedData.customerDetails.customerEmailId}
                  onChangeText={(text) => handleInputChange('customerEmailId', text, 'customerDetails')}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Customer Email"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Contact Number</Text>
                <TextInput
                  value={updatedData.customerDetails.contactNumber}
                  onChangeText={(text) => handleInputChange('contactNumber', text, 'customerDetails')}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Contact Number"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">GSTIN Number</Text>
                <TextInput
                  value={updatedData.customerDetails.address}
                  onChangeText={(text) => handleInputChange('address', text, 'customerDetails')}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter GSTIN Number"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-600 mb-1">Address</Text>
              <TextInput
                value={updatedData.customerDetails.customerAddress}
                onChangeText={(text) => handleInputChange('customerAddress', text, 'customerDetails')}
                className="bg-white p-3 rounded-lg border border-gray-200 h-24"
                placeholder="Enter Customer Address"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>

        {/* Product Details Section */}
        <ProductDetailsSection />

        {/* Transport Details Section */}
        <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center mb-6">
            <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mr-3">
              <Text className="text-blue-600 text-lg font-bold">T</Text>
            </View>
            <Text className="text-xl font-bold text-gray-800">Transport Details</Text>
          </View>

          <View className="space-y-4">
            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Vehicle Type</Text>
                <TextInput
                  value={updatedData.transportDetails.vehicleType}
                  onChangeText={(text) => handleInputChange('vehicleType', text, 'transportDetails')}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Vehicle Type"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Vehicle Number</Text>
                <TextInput
                  value={updatedData.transportDetails.vehicleNumber}
                  onChangeText={(text) => handleInputChange('vehicleNumber', text.toUpperCase(), 'transportDetails')}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Vehicle Number"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Driver Name</Text>
                <TextInput
                  value={updatedData.transportDetails.driverName}
                  onChangeText={(text) => handleInputChange('driverName', text, 'transportDetails')}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Driver Name"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Driver Contact</Text>
                <TextInput
                  value={updatedData.transportDetails.driverContactNumber}
                  onChangeText={(text) => handleInputChange('driverContactNumber', text, 'transportDetails')}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Driver Contact"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Delivery Status</Text>
                <View className="border border-gray-200 rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={updatedData.transportDetails.deliveryStatus}
                    onValueChange={(value) => handleInputChange('deliveryStatus', value, 'transportDetails')}
                    className="bg-white"
                  >
                    {deliveryStatuses.map((status) => (
                      <Picker.Item key={status} label={status} value={status} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Transport Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                >
                  <Text className="text-gray-800">
                    {new Date(updatedData.transportDetails.transportDate).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(updatedData.transportDetails.transportDate)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        handleInputChange('transportDate', selectedDate, 'transportDetails');
                      }
                    }}
                  />
                )}
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-600 mb-1">Rental Cost</Text>
              <TextInput
                value={String(updatedData.transportDetails.rentalCost)}
                onChangeText={(text) => handleInputChange('rentalCost', parseFloat(text) || 0, 'transportDetails')}
                className="bg-white p-3 rounded-lg border border-gray-200"
                placeholder="Enter Rental Cost"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Payment Details Section */}
        <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <View className="flex-row items-center mb-6">
            <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mr-3">
              <Text className="text-blue-600 text-lg font-bold">P</Text>
            </View>
            <Text className="text-xl font-bold text-gray-800">Payment Details</Text>
          </View>

          <View className="space-y-4">
            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Total Amount</Text>
                <TextInput
                  value={String(updatedData.total)}
                  editable={false}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Outstanding Payment</Text>
                <TextInput
                  value={String(updatedData.outstandingPayment)}
                  onChangeText={(text) => handleInputChange('outstandingPayment', parseFloat(text) || 0)}
                  className="bg-white p-3 rounded-lg border border-gray-200"
                  placeholder="Enter Outstanding Payment"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleUpdate}
          className="bg-green-500 p-4 rounded-xl shadow-lg mb-6"
        >
          <Text className="text-white text-center font-bold text-lg">Update Outward</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default OutwardUpdate;