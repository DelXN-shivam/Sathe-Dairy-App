import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Animated } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import getEnvVars from "../../../config/environment";
import { useAuth } from "../../contexts/authContext";

const { API_URL } = getEnvVars();

const SupplierCard = ({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.supplierInitial}>
                {item.supplierName.charAt(0).toUpperCase()}
              </Text>
              <View>
                <Text style={styles.supplierName}>{item.supplierName}</Text>
                <Text style={styles.supplierInfo}>{item.supplierMobileNo}</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </View>
          
          {item.supplierGSTNo && (
            <View style={styles.gstContainer}>
              <Text style={styles.gstLabel}>GST</Text>
              <Text style={styles.gstNumber}>{item.supplierGSTNo}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SupplierList = ({ navigation }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getAuthHeader } = useAuth();

  const handleSupplierPress = (supplierId) => {
    navigation.navigate("supplierDetail", { supplierId });
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Suppliers/getAllSupplier`, {
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0CC0DF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>suppliers</Text>
        <Text style={styles.subtitle}>{suppliers.length} suppliers</Text>
      </View>
      
      {suppliers.length > 0 ? (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <SupplierCard
              item={item}
              onPress={() => handleSupplierPress(item._id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#0CC0DF"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
          </View>
          <Text style={styles.noDataText}>No suppliers yet</Text>
          <Text style={styles.noDataSubtext}>
            Your supplier list is empty. Add your first supplier to get started.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("addSupplier")}
        activeOpacity={0.9}
      >
        <View style={styles.addButtonContent}>
          <Text style={styles.addButtonText}>Add New supplier</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#666666",
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supplierInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F7FF",
    color: "#0CC0DF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: 'center',
    lineHeight: 40,
    marginRight: 12,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  supplierInfo: {
    fontSize: 14,
    color: "#666666",
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FFF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  badgeText: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '500',
  },
  gstContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  gstLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666666",
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  gstNumber: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 32,
  },
  noDataText: {
    fontSize: 20,
    fontWeight: '600',
    color: "#1A1A1A",
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
  },
  addButtonContent: {
    backgroundColor: "#0CC0DF",
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#0CC0DF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: 'center',
  },
});

export default SupplierList;