import React, { useState, useEffect } from "react";
import { 
  View, FlatList, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl
} from "react-native";
import axios from "axios";
import getEnvVars from "../../../config/environment";
import { useAuth } from "../../contexts/authContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const { API_URL } = getEnvVars();

const TransportList = ({ navigation }) => {
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getAuthHeader } = useAuth();

  const fetchTransports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transport/getAllTransports`);
      console.log('Response Data:', response.data);
      if (response.data) {
        setTransports(response.data);
      } else {
        Alert.alert("Error", "No transport data found.");
      }
    } catch (error) {
      console.error('Error fetching transports:', error);
      Alert.alert("Error", "Failed to fetch transport records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransports();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTransports();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("updateTransport", { id: item._id })}
    >
      <View style={styles.vehicleRow}>
        <MaterialIcons name="local-shipping" size={20} color="#0CC0DF" />
        <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
      </View>
      <Text style={styles.driverName}>{item.driverName}</Text>
      
      <View style={styles.locationRow}>
        <MaterialIcons name="location-on" size={18} color="#FF5733" />
        <Text style={styles.route}>{item.source} → {item.destination}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0CC0DF" style={styles.loader} />
      ) : (
        <>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            {/* <MaterialIcons name="refresh" size={24} color="#0CC0DF" /> */}
          </TouchableOpacity>
          
          <FlatList
            data={transports}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#0CC0DF"]}
                tintColor="#0CC0DF"
              />
            }
          />
        </>
      )}
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("addTransport")}
      >
        <Text style={styles.addButtonText}>+ Add Transport</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8F9FA",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  driverName: {
    fontSize: 16,
    color: "#555",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  route: {
    fontSize: 14,
    color: "#777",
    marginLeft: 6,
  },
  addButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#0CC0DF",
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default TransportList;