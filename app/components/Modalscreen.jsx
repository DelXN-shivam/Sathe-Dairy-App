import { View, TouchableOpacity, Modal, Text, TouchableWithoutFeedback, setIsInvisible } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

const CustomTabBarButton = () => {
  const [openModal, setOpenModal] = useState(false);
  const [isInvisible, setIsInvisible] = useState(false);  // State to track visibility

  const closeModal = () => setOpenModal(false);
  return (
    <>
      <TouchableOpacity
        style={{
          top: -30,
          bottom: 15,
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => {
          setOpenModal(true);   // Open modal
          setIsInvisible(true); // Set invisible state to true when clicked
        }}
      >
        <View
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: "#0CC0DF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="add" size={30} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* Modal */}
      {openModal && (
        <Modal visible={openModal} animationType="slide" transparent={true}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View className="flex-1 justify-center items-center bg-opacity-50">
              <TouchableWithoutFeedback>
                <View className="bg-cyan-400 h-52 w-96 rounded-lg p-4">
                  <Text className="text-xl text-white font-medium">Hello World</Text>
                  <TouchableOpacity onPress={closeModal}>
                    <Text className="text-black font-normal">Close</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
};

export default CustomTabBarButton;
