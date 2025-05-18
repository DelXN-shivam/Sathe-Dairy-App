import React from "react";
import { View, Text, Dimensions, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons"; // For icons
const { width } = Dimensions.get("window");

const HeaderBar = ({ title = "Default Title" }) => {
  return (
    <View className="flex-row h-39 justify-between items-center p-2 rounded-b-lg" style={{backgroundColor : "#0CC0DF"}}>
    <Image className='w-12 h-12 rounded-full' source={require("../../assets/images/icon.png")} />
      <Text className="text-white font-bold text-2xl items-center">{title}</Text>
      <TouchableOpacity>
        <Icon name="menu" color="#FFF" size={width * 0.08} />
      </TouchableOpacity>
    </View>
  );
};

export default HeaderBar;
