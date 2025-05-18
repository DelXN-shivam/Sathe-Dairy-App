import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import getEnvVars from '../../../config/environment';
import { useAuth } from '../../contexts/authContext';

const { API_URL } = getEnvVars();

const ProductDetails = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getAuthHeader } = useAuth();

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/product/getSingleProduct/${productId}`,
        {
          headers: { ...getAuthHeader() }
        }
      );
      setProduct(response.data);
      // Fetch category name
      if (response.data.category) {
        const categoryResponse = await axios.get(
          `${API_URL}/api/category/getSingleCategory/${response.data.category}`,
          {
            headers: { ...getAuthHeader() }
          }
        );
        setCategoryName(categoryResponse.data.categoryName);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProductDetails();
  }, []);

  const handleEditPress = () => {
    navigation.navigate('updateProduct', { productId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0CC0DF" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#0CC0DF']}
          tintColor="#0CC0DF"
        />
      }
    >
      {/* <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
      </View> */}

      <View style={styles.contentContainer}>
        <Text style={styles.productName}>{product.productName}</Text>
        <Text style={styles.productCode}>Code: {product.productCode}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <DetailRow label="Category" value={categoryName} />
          <DetailRow label="Description" value={product.productDescription} />
          <DetailRow label="Product Price" value={`₹${product.productPrice.toFixed(2)}`} />
          <DetailRow label="Selling Price" value={`₹${product.sellingPrice.toFixed(2)}`} />
          <DetailRow label="Available Quantity" value={product.quantity} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <DetailRow label="Number of Bags" value={product.configuration.numberOfBags} />
          <DetailRow label="SKU Quantity" value={product.configuration.skuQuantity} />
          {product.configuration.numberOfPieces && (
            <DetailRow label="Number of Pieces" value={product.configuration.numberOfPieces} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calculations</Text>
          <DetailRow 
            label="Total Cost" 
            value={`₹${(product.sellingPrice * product.quantity).toFixed(2)}`} 
          />
          {product.configuration.numberOfPieces && (
            <DetailRow 
              label="Total Pieces" 
              value={product.configuration.numberOfPieces * product.configuration.skuQuantity} 
            />
          )}
          <DetailRow 
            label="Total Bags" 
            value={product.configuration.numberOfBags * product.configuration.skuQuantity} 
          />
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
          <Text style={styles.editButtonText}>Edit Product</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#fff',
  },
  // productImage: {
  //   width: '100%',
  //   height: '100%',
  // },
  contentContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productCode: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  editButton: {
    backgroundColor: '#0CC0DF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductDetails;