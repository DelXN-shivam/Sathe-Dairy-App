import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  Dimensions, StyleSheet, Platform, FlatList, Alert,
  TextInput, RefreshControl, ActivityIndicator
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import axios from "axios";
import getEnvVars from "../../../config/environment";
import { useAuth } from "../../contexts/authContext";

const { width, height } = Dimensions.get("window");
const { API_URL } = getEnvVars();                            

const images = {
  A: require("../../../assets/images/A.png"),     
  B: require("../../../assets/images/B.png"),
  C: require("../../../assets/images/C.png"),
  D: require("../../../assets/images/D.png"),
  E: require("../../../assets/images/I.png"),
  F: require("../../../assets/images/F.png"),
  G: require("../../../assets/images/G.png"),
  H: require("../../../assets/images/H.png"),
  I: require("../../../assets/images/I.png"),
  J: require("../../../assets/images/J.png"),
  K: require("../../../assets/images/K.png"),
  L: require("../../../assets/images/L.png"),
  M: require("../../../assets/images/M.png"),
  N: require("../../../assets/images/N.png"),
  O: require("../../../assets/images/O.png"),
  P: require("../../../assets/images/P.png"),
  Q: require("../../../assets/images/Q.png"),
  R: require("../../../assets/images/R.png"),
  S: require("../../../assets/images/S.png"),
  T: require("../../../assets/images/T.png"),
  U: require("../../../assets/images/U.png"),
  V: require("../../../assets/images/V.png"),
  W: require("../../../assets/images/W.png"),
  X: require("../../../assets/images/X.png"),
  Y: require("../../../assets/images/Y.png"),
  Z: require("../../../assets/images/Z.png"),
  a: require("../../../assets/images/userProfile.jpg"), // Default image
};

const getInitialImage = (fullName) => {
  if (!fullName) return images.D;
  const firstLetter = fullName.charAt(0).toUpperCase();
  return images[firstLetter] || images.D; // Use default if no match
};

const UserStatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4CAF50';
      case 'inactive':
        return '#F44336';
      default:
        return '#4CAF50';
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.statusText}>{status || "Active"}</Text>
    </View>
  );
};

const UserList = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getAuthHeader } = useAuth();

    const fetchUsers = async () => {
      try {
      setLoading(true);
        const response = await axios.get(`${API_URL}/api/user/getAllUsers`, {
          headers: {
            ...getAuthHeader(),
          },
        });
        setUsers(response.data);
      setFilteredUsers(response.data);
      } catch (error) {
        console.log("Error:", error);
      Alert.alert("Error", "Failed to load users. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.fullName?.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${API_URL}/api/user/deleteUser/${userId}`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      Alert.alert("Success", "User deleted successfully!");
      setUsers(users.filter((user) => user._id !== userId));
    } catch (error) {
      console.log("Error response:", error.response);
      Alert.alert("Error", "Something went wrong, please try again.");
    }
  };

  const confirmDelete = (userId) => {
    Alert.alert(
      "Delete User",
      "Are you sure you want to delete this user?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDeleteUser(userId) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <TouchableOpacity
          style={styles.addButtonSmall}
          onPress={() => navigation.navigate("addUser")}
        >
          <Icon name="person-add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6c757d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#6c757d" />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#4D90F5" style={styles.loader} />
      ) : (
      <FlatList
          data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => navigation.navigate("updateUser", { userId: item._id })}
              style={[styles.customerCard, styles.shadow]}
            >
            <Image
              style={styles.customerImage}
              source={getInitialImage(item.fullName)}
            />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.fullName}</Text>
                <View style={styles.detailsRow}>
                  <Icon name="person" size={14} color="#6c757d" style={styles.detailIcon} />
                  <Text style={styles.customerRole}>{item.role || "User"}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <UserStatusBadge status={item.status} />
                  <TouchableOpacity 
                    onPress={() => confirmDelete(item._id)}
                    style={styles.deleteButton}
                  >
                    <Icon name="delete-outline" size={20} color="#ff6b6b" />
                  </TouchableOpacity>
            </View>
          </View>
          </TouchableOpacity>
        )}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4D90F5"]}
              tintColor="#4D90F5"
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("addUser")}
      >
        <Icon name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButtonSmall: {
    backgroundColor: '#4D90F5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  customerCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  customerImage: {
    width: width * 0.15,
    height: undefined,
    aspectRatio: 1,
    borderRadius: 8,
    resizeMode: "contain",
  },
  customerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: '#333',
    marginBottom: 5,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  detailIcon: {
    marginRight: 6,
  },
  customerRole: {
    fontSize: 14,
    color: '#6c757d',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 5,
  },
  cardSeparator: {
    height: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#4D90F5',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  addCustomerContainer: {
    alignSelf: "center",
    backgroundColor: "#e6e8ea",
    borderRadius: 10,
    paddingVertical: height * 0.02,
    width: width * 0.9,
  },
  addButton: {
    backgroundColor: "#4D90F5",
    alignSelf: "center",
    width: width * 0.7,
    height: height * 0.06,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: width * 0.055,
    color: "white",
    fontWeight: "bold",
  },
  spacing: {
    height: height * 0.02,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default UserList;
