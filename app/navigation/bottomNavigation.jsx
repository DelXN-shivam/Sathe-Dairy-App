import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import Homescreen from "../screens/Homescreen";
import Invoicescreen from "../screens/Invoicescreen";
import Profilescreen from "../screens/Profilescreen";
import Reportscreen from "../screens/Reportscreen";
import ModalScreen from "../screens/Modalscreen"; // Import ModalScreen
import { Ionicons } from "@expo/vector-icons"; // For icons
import HeaderBar from "../navigation/headerBar"; // Adjust path for HeaderBar
import { View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();

const Tabs = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Check for new notifications periodically
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const count = await AsyncStorage.getItem('newInvoiceEntriesCount');
        setNotificationCount(count ? parseInt(count) : 0);
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };
    
    // Check immediately and then every 30 seconds
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // header: ({ navigation }) => {
        //   let title = "Default Title";

        //   if (route.name === "Home") title = "Home";
        //   else if (route.name === "Report") title = "Reports";
        //   else if (route.name === "Invoice") title = "Invoices";
        //   else if (route.name === "Profile") title = "User Profile";

        //   return <HeaderBar title={title} />;
        // },
        tabBarStyle: {
          position: "absolute",
          left: 25,
          right: 25,
          elevation: 0,
          backgroundColor: "#ffffff",
          borderTopEndRadius: 20,
          borderTopLeftRadius: 20,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
        },
        tabBarActiveTintColor: "#0CC0DF",
        tabBarInactiveTintColor: "gray",

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Report") {
            iconName = focused ? "bar-chart" : "bar-chart-outline";
          }
          //  else if (route.name === "Invoice") {
          //   iconName = focused ? "document-text" : "document-text-outline";
          // }

          else if (route.name === "Notification") {
            iconName = focused ? "notifications" : "notifications-outline";
          }
          else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarBadge: route.name === "Notification" && notificationCount > 0 
          ? notificationCount 
          : undefined,
        tabBarBadgeStyle: {
          backgroundColor: '#EF4444',
          fontSize: 10,
        }
      })}
    >
      <Tab.Screen name="Home" component={Homescreen} options={{ headerShown: false }} />
      <Tab.Screen name="Report" options={{headerShown:false}} component={Reportscreen} />
      <Tab.Screen
        name="Add"
        component={() => <View />}
        options={{
          headerShown: false, // No header for this screen
          tabBarButton: (props) => <ModalScreen {...props} />, // Custom Add button
        }}
      />
      <Tab.Screen name="Notification" component={Invoicescreen} />
      <Tab.Screen name="Profile" component={Profilescreen} />
    </Tab.Navigator>
  );
};

export default Tabs;
