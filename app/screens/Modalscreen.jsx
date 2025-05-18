import React, { useState } from "react";
import { View, TouchableOpacity, Modal, Text, TouchableWithoutFeedback, Dimensions, Image, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");

const CustomTabBarButton = () => {
  const [openModal, setOpenModal] = useState(false);
  const [isInvisible, setIsInvisible] = useState(false);
  const navigation = useNavigation();
  const [animation] = useState(new Animated.Value(0));

  const quickActions = [
    {
      title: "Products",
      icon: require("../../assets/images/Product.png"),
      route: "ProductList",
      gradient: ['#3B82F6', '#2563EB'],
      description: "Manage products"
    },
    {
      title: "Warehouse",
      icon: require("../../assets/images/Warehouse.png"),
      route: "warehouseList",
      gradient: ['#8B5CF6', '#6D28D9'],
      description: "Warehouse info"
    },
    {
      title: "Customers",
      icon: require("../../assets/images/Customer.png"),
      route: "CustomerList",
      gradient: ['#EC4899', '#DB2777'],
      description: "Customer details"
    },
    {
      title: "Categories",
      icon: require("../../assets/images/Category.png"),
      route: "categoryList",
      gradient: ['#10B981', '#059669'],
      description: "Manage categories"
    }
  ];

  const openModalWithAnimation = () => {
    setOpenModal(true);
    setIsInvisible(true);
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const closeModalWithAnimation = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setOpenModal(false);
      setIsInvisible(false);
    });
  };

  const modalScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });

  const modalTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });

  const handleActionPress = (route) => {
    closeModalWithAnimation();
    navigation.navigate(route);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={openModalWithAnimation}
      >
        <LinearGradient
          colors={['#0EA5E9', '#0284C7']}
          style={styles.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={30} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={openModal} animationType="none" transparent={true}>
        <TouchableWithoutFeedback onPress={closeModalWithAnimation}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [
                      { scale: modalScale },
                      { translateY: modalTranslateY }
                    ]
                  }
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Quick Actions</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeModalWithAnimation}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionGrid}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.actionItem}
                      onPress={() => handleActionPress(action.route)}
                    >
                      <LinearGradient
                        colors={action.gradient}
                        style={styles.actionContent}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Image
                          source={action.icon}
                          style={styles.actionIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.actionTitle}>{action.title}</Text>
                        <Text style={styles.actionDescription}>
                          {action.description}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = {
  fabContainer: {
    top: -30,
    bottom: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: width * 0.9,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -8,
  },
  actionItem: {
    width: "48%",
    marginBottom: 16,
  },
  actionContent: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    width: width * 0.15,
    height: width * 0.15,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
};

export default CustomTabBarButton;