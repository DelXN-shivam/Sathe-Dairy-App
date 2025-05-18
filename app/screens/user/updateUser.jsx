import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView, StyleSheet, Platform, Modal, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import getEnvVars from "../../../config/environment";
import { useAuth } from "../../contexts/authContext";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width, height } = Dimensions.get("window");
const { API_URL } = getEnvVars();

const UpdateUser = ({ route, navigation }) => {
  const { userId } = route.params;
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const { getAuthHeader, userRole } = useAuth();

  const roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' }
  ];
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/user/getSingleUser/${userId}`, {
          headers: {
            ...getAuthHeader(),
          },
        });
        const user = response.data;
        setFullName(user.fullName);
        setUsername(user.username);
        setEmail(user.email);
        setMobileNumber(user.mobileNumber);
        setRole(user.role);
      } catch (error) {
        console.log('Error:', error);
        Alert.alert('Error', 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleUpdateUser = async () => {
    try {
      // Basic validation
      if (!fullName || !username || !email || !mobileNumber) {
        Alert.alert('Validation Error', 'All fields are required');
        return;
      }

      // Username validation
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        Alert.alert('Validation Error', 'Username must be 3-30 characters and can only contain letters, numbers and underscores');
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Validation Error', 'Please enter a valid email address');
        return;
      }

      // Mobile number validation
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(mobileNumber)) {
        Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number');
        return;
      }

      setUpdating(true);
      await axios.patch(
        `${API_URL}/api/user/updateUser/${userId}`,
        {
          fullName,
          username,
          email,
          password: password || undefined, // Only include password if it's not empty
          mobileNumber,
          role,
        },
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Success alert and navigation back to user list
      Alert.alert(
        'Success', 
        'User updated successfully!', 
        [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.navigate("userList");
            }
          },
        ]
      );
    } catch (error) {
      console.log('Error response:', error.response);
      Alert.alert('Error', 'Something went wrong, please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (userRole !== 'admin') { 
    Alert.alert('Access Denied', 'Only admin can view this page', [
      { text: 'OK', onPress: () => navigation.navigate("userList", { userId }) }
    ]);
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update User</Text>
        <View style={{width: 24}} />
      </View>

      {/* Update in progress overlay */}
      {updating && (
        <View style={styles.updateOverlay}>
          <View style={styles.updateBox}>
            <ActivityIndicator size="large" color="#0CC0DF" />
            <Text style={styles.updateText}>Updating user...</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#0CC0DF" />
            <Text style={styles.loadingText}>Loading user details...</Text>
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Icon name="person-outline" size={30} color="#0CC0DF" />
              <Text style={styles.formTitle}>User Information</Text>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="person" size={20} color="#0CC0DF" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter full name"
                    value={fullName}
                    onChangeText={setFullName}
                    style={styles.input}
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="alternate-email" size={20} color="#0CC0DF" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    style={styles.input}
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="email" size={20} color="#0CC0DF" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    style={styles.input}
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={20} color="#0CC0DF" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Leave empty to keep current password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="phone" size={20} color="#0CC0DF" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter 10-digit mobile number"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    style={styles.input}
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowRoleDropdown(true)}
                >
                  <Icon name="admin-panel-settings" size={20} color="#0CC0DF" style={styles.inputIcon} />
                  <Text style={styles.dropdownButtonText}>
                    {role === 'admin' ? 'Admin' : 'User'}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} color="#0CC0DF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateUser}
            disabled={updating}
            activeOpacity={0.8}
          >
            <Icon name="check" size={22} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.updateButtonText}>Update User</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRoleDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Role</Text>
            
            {roleOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  index < roleOptions.length - 1 && styles.optionSeparator
                ]}
                onPress={() => {
                  setRole(option.value);
                  setShowRoleDropdown(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  role === option.value && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
                {role === option.value && (
                  <Icon name="check" size={20} color="#0CC0DF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f5fa",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  updateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  updateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#333',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    flexDirection: 'row',
    backgroundColor: '#0CC0DF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 30,
    height: 56,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(12,192,223,0.5)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  optionSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  optionText: {
    fontSize: 16,
    color: '#444',
  },
  optionTextSelected: {
    color: '#0CC0DF',
    fontWeight: '600',
  }
});

export default UpdateUser;
