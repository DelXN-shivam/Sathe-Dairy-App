import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  StyleSheet,
  Dimensions,
  StatusBar
} from 'react-native';
import { Picker } from "@react-native-picker/picker";
import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import getEnvVars from "../../../config/environment";
import { useAuth } from "../../contexts/authContext";

const { API_URL } = getEnvVars();
const { width } = Dimensions.get('window');

const INITIAL_FORM_STATE = {
  productName: '',
  productDescription: '',
  productPrice: '',
  productCode: '',
  category: '',
  sellingPrice: '',
  quantity: '',
  numberOfBags: '',
  skuQuantity: '',
  numberOfPieces: ''
};

const AddProduct = ({ navigation }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const { getAuthHeader, userId } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const response = await axios.get(
        `${API_URL}/api/category/getAllCategories`,
        { headers: authHeader }
      );
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert(
        'Error',
        'Failed to fetch categories. Please check your connection and try again.'
      );
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = {
      productName: 'Product name',
      productCode: 'Product code',
      productPrice: 'Product price',
      category: 'Category',
      sellingPrice: 'Selling price',
      quantity: 'Quantity',
      numberOfBags: 'Number of bags',
      skuQuantity: 'SKU quantity'
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field]?.toString().trim()) {
        newErrors[field] = `${label} is required`;
      }
    });

    // Product name validation
    if (formData.productName) {
      if (formData.productName.length < 3) {
        newErrors.productName = 'Product name must be at least 3 characters';
      } else if (formData.productName.length > 50) {
        newErrors.productName = 'Product name cannot exceed 50 characters';
      }
    }

    // Product code validation
    if (formData.productCode && !/^[A-Za-z0-9-_]+$/.test(formData.productCode)) {
      newErrors.productCode = 'Product code can only contain letters, numbers, hyphens, and underscores';
    }

    // Numeric validations
    const numericValidations = [
      {
        field: 'productPrice',
        label: 'Product price',
        min: 0,
        max: 1000000,
        allowDecimals: true
      },
      {
        field: 'sellingPrice',
        label: 'Selling price',
        min: 0,
        max: 1000000,
        allowDecimals: true
      },
      {
        field: 'quantity',
        label: 'Quantity',
        min: 0,
        max: 100000,
        allowDecimals: false
      },
      {
        field: 'numberOfBags',
        label: 'Number of bags',
        min: 0,
        max: 10000,
        allowDecimals: false
      },
      {
        field: 'skuQuantity',
        label: 'SKU quantity',
        min: 0,
        max: 100000,
        allowDecimals: false
      },
      {
        field: 'numberOfPieces',
        label: 'Number of pieces',
        min: 0,
        max: 100000,
        allowDecimals: false,
        optional: true
      }
    ];

    numericValidations.forEach(({ field, label, min, max, allowDecimals, optional }) => {
      if (formData[field] || !optional) {
        const value = Number(formData[field]);
        
        if (isNaN(value)) {
          newErrors[field] = `${label} must be a valid number`;
        } else if (value < min) {
          newErrors[field] = `${label} must be greater than ${min}`;
        } else if (value > max) {
          newErrors[field] = `${label} cannot exceed ${max}`;
        } else if (!allowDecimals && !Number.isInteger(value)) {
          newErrors[field] = `${label} must be a whole number`;
        }
      }
    });

    // Selling price validation
    if (formData.sellingPrice && formData.productPrice) {
      if (Number(formData.sellingPrice) < Number(formData.productPrice)) {
        newErrors.sellingPrice = 'Selling price cannot be less than product price';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateProduct = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check the form for errors');
      return;
    }

    setIsLoading(true);
    try {
      const authHeader = await getAuthHeader();
      
      if (!authHeader?.Authorization) {
        throw new Error('Authentication required. Please log in again.');
      }

      const payload = {
        ...formData,
        configuration: {
          numberOfBags: Number(formData.numberOfBags),
          skuQuantity: Number(formData.skuQuantity),
          numberOfPieces: Number(formData.numberOfPieces) || 0
        },
        productPrice: Number(formData.productPrice),
        sellingPrice: Number(formData.sellingPrice),
        quantity: Number(formData.quantity),
        userId,
      };

      const response = await axios.post(
        `${API_URL}/api/product/addProduct`,
        payload,
        {
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data) {
        Alert.alert(
          'Success', 
          'Product added successfully!',
          [{ 
            text: 'OK', 
            onPress: () => {
              setFormData(INITIAL_FORM_STATE);
              navigation.goBack();
            }
          }]
        );
      }
    } catch (error) {
      let errorMessage = 'An error occurred while adding the product.';
      
      if (error.response?.status === 409) {
        errorMessage = `Product with code ${formData.productCode} already exists.`;
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Product creation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = useCallback(({ 
    field, 
    placeholder, 
    keyboardType = 'default',
    multiline = false,
    isOptional = false
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {placeholder}
        {!isOptional && <Text style={styles.requiredStar}>*</Text>}
      </Text>
      <TextInput
        placeholder={placeholder}
        value={formData[field]?.toString()}
        onChangeText={(value) => handleInputChange(field, value)}
        style={[
          styles.input,
          errors[field] && styles.inputError,
          multiline && styles.multilineInput
        ]}
        keyboardType={keyboardType}
        multiline={multiline}
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  ), [formData, errors, handleInputChange]);

  const renderCategoryPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        Category
        <Text style={styles.requiredStar}>*</Text>
      </Text>
      <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
        <Picker
          selectedValue={formData.category}
          onValueChange={(value) => handleInputChange('category', value)}
          enabled={!isCategoriesLoading}
          style={styles.picker}
        >
          <Picker.Item label="Select a category" value="" />
          {categories.map((category) => (
            <Picker.Item 
              key={category._id} 
              label={category.categoryName} 
              value={category._id} 
            />
          ))}
        </Picker>
      </View>
      {errors.category && (
        <Text style={styles.errorText}>{errors.category}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Product</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderInput({ field: 'productName', placeholder: 'Product Name' })}
        {renderInput({ 
          field: 'productDescription', 
          placeholder: 'Product Description (Optional)',
          multiline: true,
          isOptional: true
        })}
        {renderInput({ 
          field: 'productPrice', 
          placeholder: 'Product Price',
          keyboardType: 'decimal-pad' 
        })}
        {renderInput({ field: 'productCode', placeholder: 'Product Code' })}
        {renderCategoryPicker()}
        {renderInput({ 
          field: 'sellingPrice', 
          placeholder: 'Selling Price',
          keyboardType: 'decimal-pad' 
        })}
        {renderInput({ 
          field: 'quantity', 
          placeholder: 'Product Quantity',
          keyboardType: 'number-pad' 
        })}
        {renderInput({ 
          field: 'numberOfBags', 
          placeholder: 'Number of Bags',
          keyboardType: 'number-pad' 
        })}
        {renderInput({ 
          field: 'numberOfPieces', 
          placeholder: 'Number of Pieces (Optional)',
          keyboardType: 'number-pad',
          isOptional: true
        })}
        {renderInput({ 
          field: 'skuQuantity', 
          placeholder: 'SKU Quantity',
          keyboardType: 'number-pad' 
        })}

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCreateProduct}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Add Product</Text>
          )}
        </TouchableOpacity>
      
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa"
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
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF5252',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  picker: {
    width: "100%",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#93D5E1",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 20
  }
});

export default AddProduct;