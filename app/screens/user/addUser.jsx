import { View, Text, TextInput, Alert, TouchableOpacity, Dimensions, ScrollView, StyleSheet, ActivityIndicator, Modal, Platform } from 'react-native';
import CheckBox from 'expo-checkbox';
import React, { useState } from 'react';
import axios from 'axios';
import getEnvVars from "../../../config/environment";
import { useAuth } from "../../contexts/authContext";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width, height } = Dimensions.get("window");

const { API_URL } = getEnvVars();

const AddUser = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState('user');
  const [permissions, setPermissions] = useState({
    create: false,
    update: false,
    delete: false,
    view: true,  // By default, a user has the 'view' permission
  });
  const [creating, setCreating] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const { getAuthHeader } = useAuth();

  const roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' }
  ];

  const handleCreateUser = async () => {
    try {
      // Basic validation
      if (!fullName || !username || !email || !password || !mobileNumber) {
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
  
      const permissionsArray = Object.keys(permissions).filter(
        (perm) => permissions[perm]
      );
      
      setCreating(true);
  
      const response = await axios.post(
        `${API_URL}/api/signup`,
        {
          fullName,
          username,
          email,
          password,
          mobileNumber,
          role,
          permissions: permissionsArray,
        },
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
  
      Alert.alert('Success', 'User created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate("userList") },
      ]);
    } catch (error) {
      console.log('Error response:', error.response?.data);
      
      // Handle specific error messages from the backend
      const errorMessage = error.response?.data?.details || 
                          error.response?.data?.error ||
                          'Something went wrong, please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New User</Text>
        <View style={{width: 24}} />
      </View>

      {/* Creating progress overlay */}
      {creating && (
        <View style={styles.updateOverlay}>
          <View style={styles.updateBox}>
            <ActivityIndicator size="large" color="#0CC0DF" />
            <Text style={styles.updateText}>Creating user...</Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Icon name="person-add" size={30} color="#0CC0DF" />
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
                  placeholder="Enter password"
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

        {/* Permissions Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Icon name="security" size={30} color="#0CC0DF" />
            <Text style={styles.formTitle}>Permissions</Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.permissionsContainer}>
            <View style={styles.permissionRow}>
              <CheckBox
                value={permissions.create}
                onValueChange={(newValue) => setPermissions({ ...permissions, create: newValue })}
                color={permissions.create ? "#0CC0DF" : undefined}
                style={styles.checkbox}
              />
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionLabel}>Create</Text>
                <Text style={styles.permissionDescription}>Can add new records to the system</Text>
              </View>
            </View>

            <View style={styles.permissionRow}>
              <CheckBox
                value={permissions.update}
                onValueChange={(newValue) => setPermissions({ ...permissions, update: newValue })}
                color={permissions.update ? "#0CC0DF" : undefined}
                style={styles.checkbox}
              />
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionLabel}>Update</Text>
                <Text style={styles.permissionDescription}>Can modify existing records</Text>
              </View>
            </View>

            <View style={styles.permissionRow}>
              <CheckBox
                value={permissions.delete}
                onValueChange={(newValue) => setPermissions({ ...permissions, delete: newValue })}
                color={permissions.delete ? "#0CC0DF" : undefined}
                style={styles.checkbox}
              />
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionLabel}>Delete</Text>
                <Text style={styles.permissionDescription}>Can remove records from the system</Text>
              </View>
            </View>

            <View style={styles.permissionRow}>
              <CheckBox
                value={permissions.view}
                onValueChange={(newValue) => setPermissions({ ...permissions, view: newValue })}
                color={permissions.view ? "#0CC0DF" : undefined}
                style={styles.checkbox}
              />
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionLabel}>View</Text>
                <Text style={styles.permissionDescription}>Can view records (basic access)</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateUser}
          disabled={creating}
          activeOpacity={0.8}
        >
          <Icon name="person-add" size={22} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.createButtonText}>Create User</Text>
        </TouchableOpacity>
      </ScrollView>

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
    marginBottom: 8,
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
  permissionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    marginRight: 15,
    borderRadius: 4,
    height: 22,
    width: 22,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 13,
    color: '#666',
  },
  createButton: {
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
  createButtonText: {
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

export default AddUser;
