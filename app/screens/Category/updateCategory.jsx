import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ScrollView, 
  Alert,
  StyleSheet,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from "../../contexts/authContext";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import getEnvVars from "../../../config/environment";

const { API_URL } = getEnvVars();

const UpdateCategory = () => {
  const [updatedCategoryName, setUpdatedCategoryName] = useState('');
  const [updatedSubCategories, setUpdatedSubCategories] = useState([]);
  const [errors, setErrors] = useState({
    categoryName: '',
    subCategories: {},
    general: ''
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { getAuthHeader, userRole } = useAuth();
  const route = useRoute();
  const { id } = route.params;

  
  useEffect(() => {
    fetchCategoryDetails();
  }, [id]);

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/category/getSingleCategory/${id}`);
      const data = await response.json();
      
      if (data) {
        setUpdatedCategoryName(data.categoryName || '');
        setUpdatedSubCategories(data.subcategory || []);
      }
    } catch (error) {
      console.error('Error fetching category details:', error);
      Alert.alert('Error', 'Failed to load category details');
    } finally {
      setLoading(false);
    }
  };

  const validateInputs = () => {
    let isValid = true;
    const newErrors = {
      categoryName: '',
      subCategories: {},
      general: ''
    };

    // Category Name Validation
    if (!updatedCategoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
      isValid = false;
    } else if (updatedCategoryName.length < 2) {
      newErrors.categoryName = 'Category name must be at least 2 characters';
      isValid = false;
    } else if (updatedCategoryName.length > 50) {
      newErrors.categoryName = 'Category name cannot exceed 50 characters';
      isValid = false;
    } else if (!/^[a-zA-Z0-9\s&-]+$/.test(updatedCategoryName)) {
      newErrors.categoryName = 'Category name can only contain letters, numbers, spaces, & and -';
      isValid = false;
    }

    // Subcategories Validation
    if (updatedSubCategories.length === 0) {
      newErrors.general = 'At least one subcategory is required';
      isValid = false;
    } else if (updatedSubCategories.length > 10) {
      newErrors.general = 'Maximum 10 subcategories allowed';
      isValid = false;
    } else {
      // Check for unique subcategories (case-insensitive)
      const uniqueSubCategories = new Set(updatedSubCategories.map(sub => sub.toLowerCase()));
      if (uniqueSubCategories.size !== updatedSubCategories.length) {
        newErrors.general = 'Duplicate subcategories are not allowed';
        isValid = false;
      }

      // Validate each subcategory
      updatedSubCategories.forEach((subCategory, index) => {
        if (!subCategory.trim()) {
          newErrors.subCategories[index] = 'Subcategory cannot be empty';
          isValid = false;
        } else if (subCategory.length < 2) {
          newErrors.subCategories[index] = 'Subcategory must be at least 2 characters';
          isValid = false;
        } else if (subCategory.length > 50) {
          newErrors.subCategories[index] = 'Subcategory cannot exceed 50 characters';
          isValid = false;
        } else if (!/^[a-zA-Z0-9\s&-]+$/.test(subCategory)) {
          newErrors.subCategories[index] = 'Subcategory can only contain letters, numbers, spaces, & and -';
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubCategoryChange = (index, newSubCategoryName) => {
    const updatedList = [...updatedSubCategories];
    updatedList[index] = newSubCategoryName;
    setUpdatedSubCategories(updatedList);
    
    // Clear error for this subcategory
    if (errors.subCategories[index]) {
      const newErrors = { ...errors };
      delete newErrors.subCategories[index];
      setErrors(newErrors);
    }
  };

  const handleAddSubCategory = () => {
    if (updatedSubCategories.length >= 10) {
      Alert.alert('Limit Reached', 'Maximum 10 subcategories allowed');
      return;
    }
    setUpdatedSubCategories([...updatedSubCategories, '']);
  };

  const handleRemoveSubCategory = (index) => {
    if (updatedSubCategories.length <= 1) {
      Alert.alert('Error', 'At least one subcategory is required');
      return;
    }
    const filteredList = updatedSubCategories.filter((_, i) => i !== index);
    setUpdatedSubCategories(filteredList);
    
    // Clear error for removed subcategory
    if (errors.subCategories[index]) {
      const newErrors = { ...errors };
      delete newErrors.subCategories[index];
      setErrors(newErrors);
    }
  };

  const handleUpdateCategory = async () => {
    try {
      if (!validateInputs()) {
        Alert.alert('Validation Error', 'Please fix the errors before updating');
        return;
      }

      setLoading(true);
      const response = await fetch(`${API_URL}/api/category/updateCategory/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          categoryName: updatedCategoryName,
          subCategories: updatedSubCategories,
        }),
      });

      const data = await response.json();
      if (data._id) {
        Alert.alert('Success', 'Category updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Something went wrong while updating the category');
    } finally {
      setLoading(false);
    }
  };


  if (userRole !== 'admin') { 
    Alert.alert('Access Denied', 'Only admin can view this page', [
      { text: 'OK', onPress: () => navigation.navigate('categoryList') }
    ]);
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0CC0DF" />
        <Text style={styles.loadingText}>Loading category details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Update Category</Text>
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
            value={updatedCategoryName}
            onChangeText={(text) => {
              setUpdatedCategoryName(text);
              if (errors.categoryName) {
                setErrors({ ...errors, categoryName: '' });
              }
            }}
            placeholder="Enter category name"
          />
          {errors.categoryName ? (
            <Text style={styles.errorText}>{errors.categoryName}</Text>
          ) : null}
        </View>

        {/* Subcategories List */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            Subcategories
            <Text style={styles.requiredStar}>*</Text>
          </Text>
          {errors.general ? (
            <Text style={styles.errorText}>{errors.general}</Text>
          ) : null}
          <FlatList
            data={updatedSubCategories}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <View style={styles.subcategoryItem}>
                <View style={[
                  styles.subcategoryInputContainer,
                  errors.subCategories[index] ? styles.inputError : null
                ]}>
                  <TextInput
                    style={styles.subcategoryInput}
                    value={item}
                    onChangeText={(text) => handleSubCategoryChange(index, text)}
                    placeholder="Enter subcategory name"
                  />
                  <TouchableOpacity 
                    onPress={() => handleRemoveSubCategory(index)}
                  >
                    <Icon name="trash-can-outline" size={24} color="#FF5252" />
                  </TouchableOpacity>
                </View>
                {errors.subCategories[index] ? (
                  <Text style={styles.errorText}>{errors.subCategories[index]}</Text>
                ) : null}
              </View>
            )}
          />
        </View>

        {/* Add Subcategory Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddSubCategory}
        >
          <Icon name="plus" size={20} color="#0CC0DF" />
          <Text style={styles.addButtonText}>Add Subcategory</Text>
        </TouchableOpacity>

        {/* Update Button */}
        <TouchableOpacity 
          style={[styles.updateButton, loading && styles.buttonDisabled]}
          onPress={handleUpdateCategory}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Icon name="check-circle" size={20} color="white" />
              <Text style={styles.updateButtonText}>
                Update Category
              </Text>
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
  inputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    marginBottom: 8,
  },
  subcategoryItem: {
    marginBottom: 12,
  },
  subcategoryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
  },
  subcategoryInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0CC0DF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#0CC0DF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  updateButton: {
    backgroundColor: "#0CC0DF",
    width: "100%",
    height: 54,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
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
  updateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
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
});

export default UpdateCategory;