import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  RefreshControl
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import getEnvVars from "../../../config/environment";
import { useAuth } from '../../contexts/authContext';

const CustomerDetail = () => {
  const { API_URL } = getEnvVars();
  const route = useRoute();
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const customerId = route.params.customerId;
  const { outwardId } = route.params;

  const [customerDetail, setCustomerDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/customer/getSingleCustomer/${customerId}`, {
        headers: { ...getAuthHeader() }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch customer details');
      }
      const data = await response.json();
      console.log('Fetched Customer and Transactions:', data);
      setCustomerDetail(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchCustomerDetails();
  }, []);

  const handleTransactionPress = (transaction) => {
    console.log('Transaction data:', transaction);
    
    if (!transaction || !transaction._id) {
      console.error('Invalid transaction data:', transaction);
      Alert.alert('Error', 'Transaction data is missing');
      return;
    }

    console.log('Navigating to OutwardDetail with ID:', transaction._id);
    navigation.navigate('OutwardDetail', { 
      outwardId: transaction._id
    });
  };

  const handleEditCustomer = () => {
    navigation.navigate('UpdateCustomer', {
      customerId: customerId,
      onUpdate: () => {
        fetchCustomerDetails();
      }
    });
  };

  const getInitials = (name) => {
    if (!name) return "NA";
    const nameArray = name.split(" ");
    return nameArray.map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-2">Loading customer details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-red-500 font-bold">Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50 p-4"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0CC0DF"]}
          tintColor="#0CC0DF"
        />
      }
    >
      {/* Customer Details Card */}
      <View className="bg-white shadow-sm rounded-xl p-6 mb-6">
        {customerDetail?.customer && (
          <>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-16 h-16 rounded-full bg-blue-500 flex justify-center items-center">
                  <Text className="text-2xl font-bold text-white">
                    {getInitials(customerDetail.customer.customerName)}
                  </Text>
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-2xl font-bold text-gray-800">
                    {customerDetail.customer.customerName}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Icon name="card-account-details" size={18} color="#64748b" />
                    <Text className="text-gray-500 ml-2">
                      {customerDetail.customer.customerGSTNo || "N/A"}
                    </Text>
                  </View>
                     
                </View>
              </View>
              <TouchableOpacity 
                onPress={handleEditCustomer}
                className="p-2 rounded-full bg-blue-50"
                >
                <Icon name="pencil" size={24} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            <View className="mt-4 space-y-2">
              <View className="flex-row items-center">
                <Icon name="phone" size={18} color="#64748b" />
                <Text className="text-gray-600 ml-2">
                  {customerDetail.customer.customerMobileNo || "N/A"}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Icon name="map-marker-outline" size={18} color="#64748b" />
                <Text className="text-gray-600 ml-2">
                  {customerDetail.customer.address || "N/A"}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Outward Transactions Section */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-gray-800 mb-4">Outward Transactions</Text>
        
        {customerDetail?.transactions?.length > 0 ? (
          customerDetail.transactions.map((transaction, index) => (
            <TouchableOpacity 
              key={index} 
              className="bg-white rounded-xl shadow-sm p-4 mb-4"
              onPress={() => handleTransactionPress(transaction)}
              activeOpacity={0.7}
            >
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Icon name="arrow-up-circle" size={20} color="#ef4444" />
                  <Text className="text-blue-600 font-semibold ml-2">
                    {transaction.invoiceNo || 'N/A'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Icon name="calendar" size={18} color="#64748b" />
                  <Text className="text-gray-500 ml-2">
                    {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-4">
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">From</Text>
                  <View className="flex-row items-center mt-1">
                    <Icon name="map-marker-circle" size={18} color="#10b981" />
                    <Text className="text-gray-700 ml-2">{transaction.source || 'N/A'}</Text>
                  </View>
                </View>
                <Icon name="arrow-right" size={20} color="#64748b" />
                <View className="flex-1">
                  <Text className="text-sm text-gray-500 text-right">To</Text>
                  <View className="flex-row items-center justify-end mt-1">
                    <Text className="text-gray-700 mr-2">{transaction.destination || 'N/A'}</Text>
                    <Icon name="map-marker-radius" size={18} color="#ef4444" />
                  </View>
                </View>
              </View>

              <View className="flex-row justify-between mb-3">
                <View className="flex-row items-center">
                  <Icon name="truck" size={18} color="#64748b" />
                  <Text className="text-gray-600 ml-2">
                    {transaction.transportDetails?.vehicleNumber || 'N/A'} ({transaction.transportDetails?.vehicleType || 'N/A'})
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Icon name="account" size={18} color="#64748b" />
                  <Text className="text-gray-600 ml-2">
                    {transaction.transportDetails?.driverName || 'N/A'}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-500">Total Amount</Text>
                <View className="flex-row items-center">
                  <Icon name="currency-inr" size={20} color="#22c55e" />
                  <Text className="text-xl font-bold text-green-600 ml-1">
                    {transaction.total ? transaction.total.toLocaleString() : 'N/A'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="bg-white rounded-xl p-6 items-center justify-center">
            <Icon name="text-box-remove-outline" size={30} color="#94a3b8" />
            <Text className="text-gray-500 mt-2">No outward transactions found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default CustomerDetail;