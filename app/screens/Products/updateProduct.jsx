import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  StyleSheet,
  StatusBar
} from 'react-native';
import axios from 'axios';
import getEnvVars from "../../../config/environment";
import { useAuth } from "../../contexts/authContext";
import { Picker } from '@react-native-picker/picker';

const { API_URL } = getEnvVars();

const UpdateProduct = ({ route, navigation }) => {
  const { productId } = route.params;
  const { getAuthHeader, userId, userRole } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCode, setProductCode] = useState('');
  const [category, setCategory] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [numberOfBags, setNumberOfBags] = useState('');
  const [skuQuantity, setSkuQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchProduct();
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/category/getAllCategories`, {
        headers: { ...getAuthHeader() }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/product/getSingleProduct/${productId}`, {
        headers: { ...getAuthHeader() }
      });
      const product = response.data;
      setProductName(product.productName);
      setProductDescription(product.productDescription);
      setProductPrice(product.productPrice?.toString());
      setProductCode(product.productCode);
      setCategory(product.category);
      setSelectedCategory(product.category);
      setSellingPrice(product.sellingPrice?.toString());
      setQuantity(product.quantity?.toString());
      setNumberOfBags(product.configuration.numberOfBags?.toString());
      setSkuQuantity(product.configuration.skuQuantity?.toString());
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
  
    // Product Name Validation
    if (!productName || !productName.trim()) {
      newErrors.productName = 'Product name is required';
    } else if (productName.trim().length < 3) {
      newErrors.productName = 'Product name must be at least 3 characters';
    } else if (productName.trim().length > 50) {
      newErrors.productName = 'Product name cannot exceed 50 characters';
    }
  
    // Product Code Validation
    if (!productCode || !productCode.trim()) {
      newErrors.productCode = 'Product code is required';
    } else if (!/^[A-Za-z0-9-_]+$/.test(productCode.trim())) {
      newErrors.productCode = 'Product code can only contain letters, numbers, hyphens, and underscores';
    }
  
    // Category Validation
    if (!category || !category.trim()) {
      newErrors.category = 'Category is required';
    } else if (category.trim().length > 30) {
      newErrors.category = 'Category cannot exceed 30 characters';
    }
  
    // Product Price Validation
    if (!productPrice || !productPrice.trim()) {
      newErrors.productPrice = 'Product price is required';
    } else {
      const numericProductPrice = parseFloat(productPrice);
      if (isNaN(numericProductPrice)) {
        newErrors.productPrice = 'Product price must be a valid number';
      } else if (numericProductPrice <= 0) {
        newErrors.productPrice = 'Product price must be greater than 0';
      } else if (numericProductPrice > 1000000) {
        newErrors.productPrice = 'Product price cannot exceed 1,000,000';
      }
    }
  
    // Selling Price Validation
    if (!sellingPrice || !sellingPrice.trim()) {
      newErrors.sellingPrice = 'Selling price is required';
    } else {
      const numericSellingPrice = parseFloat(sellingPrice);
      const numericProductPrice = parseFloat(productPrice);
      if (isNaN(numericSellingPrice)) {
        newErrors.sellingPrice = 'Selling price must be a valid number';
      } else if (numericSellingPrice <= 0) {
        newErrors.sellingPrice = 'Selling price must be greater than 0';
      } else if (numericSellingPrice < numericProductPrice) {
        newErrors.sellingPrice = 'Selling price cannot be less than product price';
      }
    }
  
    // Quantity Validation
    if (!quantity || !quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else {
      const numericQuantity = parseInt(quantity);
      if (isNaN(numericQuantity) || !Number.isInteger(numericQuantity)) {
        newErrors.quantity = 'Quantity must be a whole number';
      } else if (numericQuantity < 0) {
        newErrors.quantity = 'Quantity cannot be negative';
      } else if (numericQuantity > 100000) {
        newErrors.quantity = 'Quantity cannot exceed 100,000';
      }
    }
  
    // Optional fields validation
    if (numberOfBags && numberOfBags.trim()) {
      const numericBags = parseInt(numberOfBags);
      if (isNaN(numericBags) || !Number.isInteger(numericBags)) {
        newErrors.numberOfBags = 'Number of bags must be a whole number';
      } else if (numericBags < 0) {
        newErrors.numberOfBags = 'Number of bags cannot be negative';
      } else if (numericBags > 10000) {
        newErrors.numberOfBags = 'Number of bags cannot exceed 10,000';
      }
    }
  
    if (skuQuantity && skuQuantity.trim()) {
      const numericSKU = parseInt(skuQuantity);
      if (isNaN(numericSKU) || !Number.isInteger(numericSKU)) {
        newErrors.skuQuantity = 'SKU quantity must be a whole number';
      } else if (numericSKU < 0) {
        newErrors.skuQuantity = 'SKU quantity cannot be negative';
      } else if (numericSKU > 100000) {
        newErrors.skuQuantity = 'SKU quantity cannot exceed 100,000';
      }
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProduct = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check the form for errors');
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.patch(
        `${API_URL}/api/product/updateProduct/${productId}`,
        {
          productName,
          productDescription,
          productPrice,
          productCode,
          category,
          sellingPrice,
          quantity,
          configuration: {
            numberOfBags,
            skuQuantity,
          },
          userId,
        },
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );

      Alert.alert('Success', 'Product updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Something went wrong, please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const renderInput = (label, value, setValue, keyboardType = "default", fieldName, multiline = false, required = true) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.requiredStar}>*</Text>}
      </Text>
      <TextInput
        placeholder={label}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          if (errors[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: '' }));
          }
        }}
        style={[
          styles.input,
          errors[fieldName] && styles.inputError,
          multiline && styles.multilineInput
        ]}
        keyboardType={keyboardType}
        multiline={multiline}
      />
      {errors[fieldName] && (
        <Text style={styles.errorText}>{errors[fieldName]}</Text>
      )}
    </View>
  );

  const renderCategoryPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        Category
        <Text style={styles.requiredStar}>*</Text>
      </Text>
      <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => {
            setSelectedCategory(itemValue);
            setCategory(itemValue);
            if (errors.category) {
              setErrors(prev => ({ ...prev, category: '' }));
            }
          }}
          style={styles.picker}
        >
          <Picker.Item label="Select a category" value="" />
          {categories.map((cat) => (
            <Picker.Item 
              key={cat._id} 
              label={cat.categoryName} 
              value={cat._id} 
            />
          ))}
        </Picker>
      </View>
      {errors.category && (
        <Text style={styles.errorText}>{errors.category}</Text>
      )}
    </View>
  );

  if (userRole !== 'admin') { 
    Alert.alert('Access Denied', 'Only admin can view this page', [
      { text: 'OK', onPress: () => navigation.navigate("ProductDetail", { productId }) }
    ]);
    return null;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0CC0DF" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Update Product</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderInput("Product Name", productName, setProductName, "default", "productName")}
        {renderInput("Product Description", productDescription, setProductDescription, "default", "productDescription", true, false)}
        {renderInput("Product Price", productPrice, setProductPrice, "numeric", "productPrice")}
        {renderInput("Product Code", productCode, setProductCode, "default", "productCode")}
        {renderCategoryPicker()}
        {renderInput("Selling Price", sellingPrice, setSellingPrice, "numeric", "sellingPrice")}
        {renderInput("Quantity", quantity, setQuantity, "numeric", "quantity")}
        {renderInput("Number of Bags", numberOfBags, setNumberOfBags, "numeric", "numberOfBags")}
        {renderInput("SKU Quantity", skuQuantity, setSkuQuantity, "numeric", "skuQuantity")}

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleUpdateProduct} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Update Product</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  inputContainer: {
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
  inputLabel: {
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
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  button: {
    backgroundColor: "#0CC0DF",
    width: "100%",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UpdateProduct;