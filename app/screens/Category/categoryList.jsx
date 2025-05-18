import { View, Text, TouchableOpacity, FlatList, Dimensions, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import getEnvVars from "../../../config/environment";
const { API_URL } = getEnvVars();

const { width } = Dimensions.get("window");

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/category/getAllCategories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, []);

  const handleCategoryPress = (categoryId) => {
    navigation.navigate("updateCategory", { id: categoryId });
  };

  const ListHeader = () => (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-2xl font-bold text-gray-800">Category List</Text>
      <TouchableOpacity
        className="p-2 rounded-full bg-white shadow-sm"
        onPress={onRefresh}
      >
        <Icon name="refresh" size={24} color="#0CC0DF" />
      </TouchableOpacity>
    </View>
  );

  const ListFooter = () => (
    <View className="h-20" />
  );

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0CC0DF"]}
            tintColor="#0CC0DF"
          />
        }
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-300 flex-row items-center"
            onPress={() => handleCategoryPress(item._id)}
          >
            <Icon name="shape" size={24} color="#0CC0DF" />
            <Text className="text-lg font-semibold text-gray-700 ml-3 flex-1">
              {item.categoryName}
            </Text>
            <Icon name="chevron-right" size={24} color="#64748b" />
          </TouchableOpacity>
        )}
      />

      {/* Floating Add Button */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          className="px-5 py-3 rounded-full shadow-lg flex-row items-center"
          style={{backgroundColor: "#0CC0DF"}}
          onPress={() => navigation.navigate("addCategory")}
        >
          <Icon name="plus" size={20} color="white" />
          <Text className="text-white text-lg font-bold ml-2">Add Category</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CategoryList;