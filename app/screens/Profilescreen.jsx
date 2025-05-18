import React, { useEffect, useState } from "react";
import getEnvVars from "../../config/environment";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Image,
    StyleSheet
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../contexts/authContext";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const { width, height } = Dimensions.get("window");
const { API_URL } = getEnvVars();

export default function Profile({ navigation }) {
    const { authState, onLogout } = useAuth();
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

    const getUserIDFromToken = (token) => {
        try {
            const decodedToken = jwtDecode(token);
            setUserId(decodedToken.userId);
            return decodedToken.userId;
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    };

    const fetchUserDetails = async (userId) => {
        if (!userId) {
            setError("User ID is missing.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const token = authState?.token;
            
            // Fix: remove the extra "Bearer" prefix
            const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            
            const response = await axios.get(`${API_URL}/api/user/getSingleUser/${userId}`, {
                headers: { Authorization: formattedToken },
            });

            if (response.data) {
                setUserDetails(response.data);
            } else {
                setError("No user details found.");
            }
        } catch (error) {
            console.error("Error fetching user details:", error.response || error.message);
            setError("Failed to fetch user details. Please try logging in again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authState?.authenticated) {
            const token = authState?.token;
            const userIdFromToken = getUserIDFromToken(token);
            fetchUserDetails(userIdFromToken);
        }
    }, [authState]);

    const MenuItem = ({ icon, title, onPress, color = "#0CC0DF" }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.menuIconContainer}>
                <Icon name={icon} color={color} size={24} />
            </View>
            <Text style={styles.menuTitle}>{title}</Text>
            <Icon name="chevron-right" color="#6B7280" size={24} style={styles.chevron} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0CC0DF" />
                <Text style={styles.loadingText}>Loading user details...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => {
                        setError(null);
                        setLoading(true);
                        fetchUserDetails(userId);
                    }}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarInner}>
                        <Icon name="person" size={50} color="#FFF" />
                    </View>
                    {/* <TouchableOpacity style={styles.editAvatarButton}>
                        <Icon name="photo-camera" size={20} color="#FFF" />
                    </TouchableOpacity> */}
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{userDetails?.fullName || "User Name"}</Text>
                    <Text style={styles.userRole}>{userDetails?.role || "User Role"}</Text>
                </View>

                <View style={styles.contactInfo}>
                    <View style={styles.contactItem}>
                        <Icon name="phone" size={16} color="#0CC0DF" />
                        <Text style={styles.contactText}>{userDetails?.mobileNumber || "+91 0000000000"}</Text>
                    </View>
                    <View style={styles.contactItem}>
                        <Icon name="email" size={16} color="#0CC0DF" />
                        <Text style={styles.contactText}>{userDetails?.email || "Email Address"}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.menuSection}>
                {/* <Text style={styles.sectionTitle}>Account</Text>
                <MenuItem 
                    icon="settings" 
                    title="Account Settings" 
                    onPress={() => {}} 
                /> */}
                <MenuItem
                    icon="supervisor-account"
                    title="Manage Users"
                    onPress={() => navigation.navigate("userList")}
                />
                {/* <MenuItem 
                    icon="build" 
                    title="Customization" 
                    onPress={() => {}} 
                /> */}
            </View>

            <View style={styles.buttonContainer}>
                {/* <TouchableOpacity
                    onPress={() => navigation.navigate("EditProfile")}
                    style={[styles.button, styles.editButton]}
                    activeOpacity={0.8}
                >
                    <Icon name="edit" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity> */}

                <TouchableOpacity
                    style={[styles.button, styles.logoutButton]}
                    onPress={onLogout}
                    activeOpacity={0.8}
                >
                    <Icon name="logout" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#FFF',
        padding: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#0CC0DF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0CC0DF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 16,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 16,
        color: '#6B7280',
    },
    contactInfo: {
        width: '100%',
        gap: 8,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 12,
    },
    contactText: {
        color: '#4B5563',
        fontSize: 14,
    },
    menuSection: {
        padding: 20,
        paddingBottom: 10, // Reduced from 20 to 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        flex: 1,
    },
    chevron: {
        marginLeft: 8,
    },
    buttonContainer: {
        padding: 20,
        paddingTop: 10, // Reduced from 20 to 10
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    editButton: {
        backgroundColor: '#50C878',
    },
    logoutButton: {
        backgroundColor: '#F14C4C',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 20,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#0CC0DF',
        padding: 12,
        borderRadius: 8,
        width: 120,
        alignItems: 'center',
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '600',
    }
});