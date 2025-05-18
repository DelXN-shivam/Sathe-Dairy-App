import React, { useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  Dimensions, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar 
} from "react-native";
import { ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@react-navigation/native';
import { useAuth } from "../contexts/authContext";
import { LinearGradient } from 'expo-linear-gradient';

export default function Login() {
  const navigation = useNavigation();
  const { width, height } = Dimensions.get("window");
  const [isVisible, setIsVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { onLogin } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      setError(true);
      setErrorText("Please fill all fields.");
      setTimeout(() => {
        setError(false);
        setErrorText("");
      }, 3000);
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(username, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Homescreen' }],
      });
    } catch (error) {
      setError(true);
      setErrorText("Invalid username or password.");
      Alert.alert("Login Failed", "Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1,
          justifyContent: 'flex-start',
          paddingBottom: 40
        }}
      >
        <View style={{ 
          alignItems: 'center',
          paddingTop: 0,
        }}>
          {/* Logo or Illustration */}
          <Image
            source={require("../../assets/images/GroupImg.png")}
            style={{ 
              width: width,
              height: width * 0.9,
              resizeMode: 'stretch',
              marginBottom: 20
            }}
          />

          {/* Title */}
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#0e7490',
            marginBottom: 30,
          }}>
            Welcome Back
          </Text>

          {/* Login Form Card */}
          <View style={{
            width: width * 0.9,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 20,
            shadowColor: '#0cc0df',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
            marginBottom: 20,
          }}>
            {/* Username Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#475569',
                marginBottom: 8,
                marginLeft: 4
              }}>
                Username
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: error && !username ? '#ef4444' : '#e2e8f0',
                borderRadius: 12,
                backgroundColor: '#f8fafc',
                paddingHorizontal: 16,
                height: 60,
              }}>
                <Icon name="person" size={20} color="#94a3b8" />
                <TextInput
                  placeholder="Enter your username"
                  placeholderTextColor="#94a3b8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!isLoading}
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 16,
                    color: '#1e293b',
                  }}
                />
              </View>
              {error && !username && (
                <Text style={{ color: '#ef4444', marginTop: 4, marginLeft: 4 }}>
                  {errorText}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#475569',
                marginBottom: 8,
                marginLeft: 4
              }}>
                Password
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: error && !password ? '#ef4444' : '#e2e8f0',
                borderRadius: 12,
                backgroundColor: '#f8fafc',
                paddingHorizontal: 16,
                height: 60,
              }}>
                <Icon name="lock" size={20} color="#94a3b8" />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isVisible}
                  autoCapitalize="none"
                  editable={!isLoading}
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 16,
                    color: '#1e293b',
                  }}
                />
                <TouchableOpacity onPress={() => setIsVisible(!isVisible)} disabled={isLoading}>
                  <Icon
                    name={isVisible ? "visibility" : "visibility-off"}
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
              {error && !password && (
                <Text style={{ color: '#ef4444', marginTop: 4, marginLeft: 4 }}>
                  {errorText}
                </Text>
              )}
            </View>

            {/* Forgot Password */}
            <View style={{ alignItems: 'flex-end', marginBottom: 20 }}>
              <TouchableOpacity>
                <Text style={{ color: '#0cc0df', fontWeight: '500' }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={{ marginTop: 10 }}
            >
              <LinearGradient
                colors={['#0cc0df', '#0e7490']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 56,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#ffffff" />
                ) : (
                  <Text style={{ 
                    color: 'white', 
                    fontSize: 18, 
                    fontWeight: 'bold' 
                  }}>
                    Sign In
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer Text */}
          <Text style={{ 
            color: '#64748b', 
            marginTop: 20, 
            textAlign: 'center',
            fontSize: 14
          }}>
            © 2024 Sathe Dairy. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
