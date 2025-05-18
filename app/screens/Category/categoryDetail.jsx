import { View, Text, StyleSheet, TouchableOpacity, FlatList, Button, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import getEnvVars from "../../../config/environment";
import { useAuth } from "../../contexts/authContext"; // Import the AuthContext

const { width, height } = Dimensions.get("window");

const { API_URL } = getEnvVars();
const CategoryDetail = () => {
  const [category, setCategory] = useState(null);
  const route = useRoute(); // Get the route props
  const { id } = route.params; // Get the category ID from the route params
  const navigation = useNavigation();

  useEffect(() => {
    // Fetch the specific category based on its id
    const fetchCategory = async () => {
      try {
        const response = await fetch(`${API_URL}/api/category/getSingleCategory/${id}`);
        const data = await response.json();
        if (data.error) {
          console.error('Error:', data.error);
        } else {
          setCategory(data); // Store the category data
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    };

    fetchCategory();
  }, [id]); // Fetch when the id changes

  if (!category) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category Detail</Text>
      <Text style={styles.text}>Category Name: {category.categoryName}</Text>
      <Text style={styles.text}>Subcategories: {category.subcategory.join(', ')}</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("addCategory")}>
      
        <Text style={styles.addButtonText}>+ Add Category</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CategoryDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#0CC0DF',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
    width:width*0.6
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
