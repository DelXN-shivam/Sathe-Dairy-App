import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  StyleSheet,
  StatusBar
} from 'react-native';
import axios from 'axios';
import { useAuth } from "../../contexts/authContext";
import getEnvVars from "../../../config/environment";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get("window");
const { API_URL } = getEnvVars();

const AddCategory = ({ navigation }) => {
  const [categoryName, setCategoryName] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    categoryName: '',
    subcategory: ''
  });
  const { getAuthHeader } = useAuth();

  const validateInputs = () => {
    let isValid = true;
    const newErrors = {
      categoryName: '',
      subcategory: ''
    };

    // Category Name Validation
    if (!categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
      isValid = false;
    } else if (categoryName.length < 2) {
      newErrors.categoryName = 'Category name must be at least 2 characters';
      isValid = false;
    } else if (categoryName.length > 50) {
      newErrors.categoryName = 'Category name cannot exceed 50 characters';
      isValid = false;
    } else if (!/^[a-zA-Z0-9\s&-]+$/.test(categoryName)) {
      newErrors.categoryName = 'Category name can only contain letters, numbers, spaces, & and -';
      isValid = false;
    }

    // Subcategory Validation
    if (!subcategory.trim()) {
      newErrors.subcategory = 'At least one subcategory is required';
      isValid = false;
    } else {
      const subcategories = subcategory.split(',').map(sub => sub.trim());
      
      // Check for empty subcategories
      if (subcategories.some(sub => sub === '')) {
        newErrors.subcategory = 'Empty subcategories are not allowed';
        isValid = false;
      }
      
      // Check subcategory length and characters
      for (const sub of subcategories) {
        if (sub.length < 2) {
          newErrors.subcategory = 'Each subcategory must be at least 2 characters';
          isValid = false;
          break;
        }
        if (sub.length > 50) {
          newErrors.subcategory = 'Each subcategory cannot exceed 50 characters';
          isValid = false;
          break;
        }
        if (!/^[a-zA-Z0-9\s&-]+$/.test(sub)) {
          newErrors.subcategory = 'Subcategories can only contain letters, numbers, spaces, & and -';
          isValid = false;
          break;
        }
      }

      // Check for duplicate subcategories
      const uniqueSubcategories = new Set(subcategories.map(sub => sub.toLowerCase()));
      if (uniqueSubcategories.size !== subcategories.length) {
        newErrors.subcategory = 'Duplicate subcategories are not allowed';
        isValid = false;
      }

      // Check maximum number of subcategories
      if (subcategories.length > 10) {
        newErrors.subcategory = 'Maximum 10 subcategories allowed';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateCategory = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const subcategoryArray = subcategory.split(',').map(sub => sub.trim());
      
      const response = await axios.post(
        `${API_URL}/api/category/addCategory`,
        { categoryName, subcategory: subcategoryArray },
        { headers: { ...getAuthHeader(), 'Content-Type': 'application/json' } }
      );

      Alert.alert('Success', 'Category added successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            // Clear form after successful submission
            setCategoryName('');
            setSubcategory('');
            setErrors({ categoryName: '', subcategory: '' });
            navigation.goBack();
          }
        },
      ]);
    } catch (error) {
      console.log('Error response:', error.response);
      console.log('Error message:', error.message);

      if (error.response?.status === 401) {
        Alert.alert('Authorization Error', 'Authorization token is missing.');
      } else if (error.response?.status === 500) {
        Alert.alert('Server Error', 'Internal server error. Please try again later.');
      } else {
        Alert.alert('Error', 'Something went wrong, please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Category</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Category Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Category Name
            <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.categoryName ? styles.inputError : null
            ]}
            placeholder="Enter category name"
            value={categoryName}
            onChangeText={(text) => {
              setCategoryName(text);
              if (errors.categoryName) {
                setErrors(prev => ({ ...prev, categoryName: '' }));
              }
            }}
          />
          {errors.categoryName ? (
            <Text style={styles.errorText}>{errors.categoryName}</Text>
          ) : null}
        </View>

        {/* Subcategories Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Subcategories
            <Text style={styles.requiredStar}>*</Text>
          </Text>
          <Text style={styles.inputDescription}>
            Enter subcategories separated by commas (e.g., Electronics, Furniture, Books)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
              errors.subcategory ? styles.inputError : null
            ]}
            placeholder="Enter subcategories"
            value={subcategory}
            onChangeText={(text) => {
              setSubcategory(text);
              if (errors.subcategory) {
                setErrors(prev => ({ ...prev, subcategory: '' }));
              }
            }}
            multiline={true}
            numberOfLines={3}
          />
          {errors.subcategory ? (
            <Text style={styles.errorText}>{errors.subcategory}</Text>
          ) : null}
        </View>

        {/* Add Category Button */}
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleCreateCategory}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Icon name="plus" size={20} color="white" />
              <Text style={styles.buttonText}>Add Category</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  inputDescription: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 12,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
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

export default AddCategory;