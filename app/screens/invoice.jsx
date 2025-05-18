import { View, Text, ScrollView, TouchableOpacity, Dimensions, TextInput, Platform, FlatList } from "react-native";
import React from 'react';
import Icon from "react-native-vector-icons/MaterialIcons"; // For icons
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

const { width, height } = Dimensions.get("window");

const Invoice = () => {

    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [mode, setMode] = useState('date');

    const handleDateChange = (event, date) => {
        const currentDate = date || selectedDate;
        setShowPicker(false); // Hide picker after selection
        setSelectedDate(currentDate);
    };

    const showDatePicker = () => {
        setMode('date');
        setShowPicker(true);
    };

    const showTimePicker = () => {
        setMode('time');
        setShowPicker(true);
    };

    const productsData = {
        products: [
            { name: "Premium Dog Food", Quantity: "30", Rate: "₹1200", Amount: "₹36000" },
            { name: "Premium Cat Food", Quantity: "20", Rate: "₹1200", Amount: "₹36000" },
        ],
    };

    const renderItem = ({ item }) => (
        <View className="flex-row justify-between items-center py-3 border-b border-gray-300 bg-white shadow-lg rounded-lg my-2">
            <Text className="text-lg text-gray-800" style={{ width: width * 0.35 }}>{item.name}</Text>
            <Text className="text-lg text-gray-800" style={{ width: width * 0.2 }}>{item.Quantity}</Text>
            <Text className="text-lg text-gray-800" style={{ width: width * 0.2 }}>{item.Rate}</Text>
            <Text className="text-lg text-gray-800" style={{ width: width * 0.2 }}>{item.Amount}</Text>
        </View>
    );

    return (
        <ScrollView>
            <View className="flex-row justify-start items-start bg-white rounded-lg "
                style={{
                    height: height * 0.1,
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 }, // Vertical offset for the shadow
                    elevation: 3
                }}>
                <TouchableOpacity className="p-5 top-3">
                    <Icon name="arrow-back" size={30} color={"black"}></Icon>
                </TouchableOpacity>
                <Text className="text-3xl font-extrabold p-5 top-3">Invoice</Text>
            </View>

            <View className="h-1"></View>

            <View className="bg-white rounded-lg"
                style={{
                    height: height * 1.4,
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 }, // Vertical offset for the shadow
                    elevation: 3
                }}>

                {/* Date Picker */}
                {showPicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode={mode}
                        is24Hour={true}
                        display={Platform.OS === 'android' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                    />
                )}
                <View className="h-4"></View>
                <View className="flex-row justify-between items-center">
                    <Text className="text-2xl font-bold px-5 top-3">INV-20024-001</Text>
                    <TouchableOpacity className="px-4 top-3">
                        <Text className="bg-orange-200 text-orange-500 rounded-full text-center" style={{ width: width * 0.25, height: height * 0.028 }}>Outward</Text>
                    </TouchableOpacity>
                </View>
                <TextInput placeholder={selectedDate.toLocaleDateString()} onPress={showDatePicker} className="px-5"></TextInput>

                <View className="h-1"></View>

                <View className="flex-row justify-start items-center">
                    <TouchableOpacity className="top-5 px-5">
                        <Icon name="location-on" size={20} color="gray"></Icon>
                    </TouchableOpacity>
                    <Text className="top-5 text-lg font-medium">Mumbai Warehouse</Text>
                    <TouchableOpacity className="px-5">
                        <Icon name="arrow-forward-ios" size={15} color="gray" className="top-6"></Icon>
                    </TouchableOpacity>
                    <Text className="top-6 px-3 text-lg font-medium">Delhi Store</Text>
                </View>

                <View className="h-10"></View>

                <View className="flex-row justify-between items-center px-9">
                    <View
                        className="bg-white rounded-lg p-4 shadow-xl px-5"
                        style={{
                            width: width * 0.35,
                            height: height * 0.1,
                            shadowColor: "#000",
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 5,
                        }}>

                        <TouchableOpacity>
                            <Text className="text-base font-medium text-gray-600 mb-1">Rate</Text>
                            <Text className="text-xl font-bold text-gray-900 mb-1">₹800</Text>
                        </TouchableOpacity>
                    </View>

                    <View
                        className="bg-white rounded-lg p-4 shadow-xl px-5"
                        style={{
                            width: width * 0.35,
                            height: height * 0.1,
                            shadowColor: "#000",
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 5,
                        }}>

                        <TouchableOpacity>
                            <Text className="text-base font-medium text-gray-600 mb-1">Quantity</Text>
                            <Text className="text-xl font-bold text-gray-900 mb-1">30</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="h-5"></View>

                <View className="flex-row justify-between items-center px-9">

                    <View
                        className="bg-white rounded-lg p-4 shadow-xl px-5"
                        style={{
                            width: width * 0.35,
                            height: height * 0.1,
                            shadowColor: "#000",
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 5,
                        }}>

                        <TouchableOpacity>
                            <Text className="text-base font-medium text-gray-600 mb-1">Bag Quantity</Text>
                            <Text className="text-xl font-bold text-gray-900 mb-1">60</Text>
                        </TouchableOpacity>
                    </View>

                    <View
                        className="bg-white rounded-lg p-4 shadow-xl px-5"
                        style={{
                            width: width * 0.35,
                            height: height * 0.1,
                            shadowColor: "#000",
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 5,
                        }}>

                        <TouchableOpacity>
                            <Text className="text-base font-medium text-gray-600 mb-1">Amount</Text>
                            <Text className="text-xl font-bold text-gray-900 mb-1">₹24000</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="h-7"></View>

                <View className="flex-row justify-start items-start px-5">
                    <Icon name="directions-car" size={24}></Icon>
                    <Text className="text-lg px-3">DL-01-CD-5678</Text>
                </View>

                <View className="flex-row justify-start items-start px-5 top-3">
                    <Icon name="call" size={24}></Icon>
                    <Text className="text-lg px-3">+91 9876548325</Text>
                </View>

                <View className="flex-row justify-start items-start px-5 top-6">
                    <Icon name="person" size={24}></Icon>
                    <Text className="text-lg px-3">+91 7876548325</Text>
                </View>

                <View className="h-9"></View>

                {/* Product Table */}
                <View className="px-4 my-5">
                    <Text className="text-xl font-bold">Product Details</Text>
                </View>
                <View className="px-4">
                    <View className="flex-row justify-between items-center py-3 border-b border-gray-300 bg-gray-100 rounded-t-lg">
                        <Text className="text-lg font-semibold text-gray-800" style={{ width: width * 0.35 }}>Product</Text>
                        <Text className="text-lg font-semibold text-gray-800" style={{ width: width * 0.2 }}>Qty</Text>
                        <Text className="text-lg font-semibold text-gray-800" style={{ width: width * 0.2 }}>Rate</Text>
                        <Text className="text-lg font-semibold text-gray-800" style={{ width: width * 0.2 }}>Amount</Text>
                    </View>

                    {/* Using FlatList to render products */}
                    <FlatList
                        data={productsData.products}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                    />
                </View>

                <View className="h-5"></View>

                <View className="bg-slate-300"
                    style={{
                        height: height * 0.14,
                        shadowColor: "#000",
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 5,
                        marginHorizontal: 15,
                    }}>
                    <View className="flex-row justify-between items-center px-5 top-3">
                        <Text className="text-lg font-normal">Total Quantity</Text>
                        <Text className="text-lg font-normal">50 Units</Text>
                    </View>

                    <View className="flex-row justify-between items-center px-5 top-4">
                        <Text className="text-lg font-normal">Bag Quantity</Text>
                        <Text className="text-lg font-normal">100 bags</Text>
                    </View>

                    <View className="flex-row justify-between items-center px-5 top-5">
                        <Text className="text-xl font-bold">Total Amount</Text>
                        <Text className="text-xl font-bold">₹60,000</Text>
                    </View>
                </View>
                <View className="top-10">
                    <TouchableOpacity className="flex-row justify-center items-center">
                        <Text className="text-xl font-bold color-white text-center rounded-lg p-3" style={{ backgroundColor: "#17C6ED", width: width * 0.9, height: height * 0.063 }}>Download Invoice</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
    );
}
export default Invoice;
