import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ImageBackground,
  StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import getEnvVars from "../../../config/environment";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { API_URL } = getEnvVars();
const { width } = Dimensions.get("window");

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchWarehouses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/warehouse/getAllWarehouse`);
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data);
      } else {
        Alert.alert("Error", "Failed to fetch warehouses.");
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      Alert.alert("Error", "Something went wrong while fetching warehouses.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWarehouses();
  };

  const handleWarehousePress = (id) => {
    navigation.navigate("updateWarehouse", { id });
  };

  const renderWarehouseCard = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => handleWarehousePress(item._id)}
      style={styles.card}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="business-outline" size={24} color="#0CC0DF" />
              </View>
              <View>
                <Text style={styles.title}>{item.warehouseName}</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#FF5252' }]} />
                  <Text style={styles.statusText}>{item.status || 'Active'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.capacityBadge}>
              <Ionicons name="cube-outline" size={16} color="#0CC0DF" />
              <Text style={styles.capacityText}>
                {item.warehouseCapacity} units
              </Text>
            </View>
          </View>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.location}>{item.warehouseLocation}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.detailsButton}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Ionicons name="chevron-forward" size={20} color="#0CC0DF" />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Warehouses</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0CC0DF" />
          <Text style={styles.loadingText}>Loading warehouses...</Text>
        </View>
      ) : warehouses.length > 0 ? (
        <FlatList
          data={warehouses}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderWarehouseCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#0CC0DF"]}
              tintColor="#0CC0DF"
              title="Pull to refresh"
              titleColor="#6c757d"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="business-outline" size={48} color="#0CC0DF" />
          </View>
          <Text style={styles.noDataText}>No warehouses found</Text>
          <Text style={styles.noDataSubText}>
            Add a new warehouse to get started
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("addWarehouse")}
      >
        <LinearGradient
          colors={['#0CC0DF', '#0A9BC7']}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
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
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Added extra padding at the bottom to prevent list items from being hidden behind the button
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  capacityBadge: {
    backgroundColor: "#E8F7FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  capacityText: {
    color: "#0CC0DF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  location: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  viewDetailsText: {
    color: "#0CC0DF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default WarehouseList;