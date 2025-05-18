import { View, Text, Dimensions, TouchableOpacity } from 'react-native'
import React from 'react'
import Icon from "react-native-vector-icons/MaterialIcons"; // For icons
import { ScrollView, TextInput, Platform, activeButton, } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { setActiveButton } from 'react';
import { PieChart } from "react-native-chart-kit";
import * as Progress from "react-native-progress"; // Import Progress Bar


const { width, height } = Dimensions.get("window");

const analytics = () => {
    const [activeButton, setActiveButton] = useState("Inward");
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


    return (
        <ScrollView className="bg-slate-100">

            <View className="flex-row justify-between items-center bg-white rounded-xl"
                style={{
                    height: height * 0.11,
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 }, // Vertical offset for the shadow
                    elevation: 5
                }}>
                <Text className="font-bold text-2xl p-4">Analytics Dashboard</Text>
                <Icon name="account-circle" color="#17C6ED" size={30} className="right-6"></Icon>
            </View>

            <View className="h-7"></View>
            <View
                className="bg-white rounded-xl"
                style={{
                    height: height * 0.13,
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 }, // Vertical offset for the shadow
                    elevation: 5,
                }}>

                <View className="px-4">
                    {/* Labels */}
                    <View className="flex-row justify-between items-center px-2">
                        <Text className="text-base font-medium top-3">Start Date</Text>
                        <Text className="text-base font-medium top-3">End Date</Text>
                    </View>

                    <View className="h-4"></View>

                    {/* Inputs with Icons */}
                    <View className="flex-row justify-between items-center">

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
                        {/* Start Date Input */}
                        <View className="flex-1 relative">
                            <TextInput
                                placeholder={selectedDate.toLocaleDateString()} onPress={showDatePicker}
                                className="border border-slate-300 rounded-lg px-9 h-12"
                                style={{ width: width * 0.43 }}
                            />
                            <TouchableOpacity className="absolute px-2 top-3">
                                <Icon name="calendar-month" size={20} color="grey" />
                            </TouchableOpacity>
                        </View>
                        {/* End Date Input */}
                        <View className="flex-1 relative">
                            <TextInput
                                placeholder={selectedDate.toLocaleDateString()} onPress={showDatePicker}
                                className="border border-slate-300 rounded-lg px-9 h-12"
                                style={{ width: width * 0.43 }}
                            />
                            <TouchableOpacity className="absolute px-2 top-3">
                                <Icon name="calendar-month" size={20} color="grey" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            <View className="h-7"></View>

            <View
                className="flex-row justify-between items-center bg-white rounded-xl px-5"
                style={{
                    height: height * 0.1,
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 5,
                }}>

                {/* Inward Button */}
                <TouchableOpacity
                    onPress={() => setActiveButton("Inward")}
                    style={{
                        width: width * 0.38,
                        backgroundColor: activeButton === "Inward" ? "#17C6ED" : "white",
                        borderRadius: 8,
                        paddingVertical: 9,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "lightgray",
                    }}>

                    <Text
                        style={{
                            color: activeButton === "Inward" ? "white" : "black",
                            fontSize: 18,
                            fontWeight: "medium",
                        }}>

                        Inward
                    </Text>
                </TouchableOpacity>

                {/* Outward Button */}
                <TouchableOpacity
                    onPress={() => setActiveButton("Outward")}
                    style={{
                        width: width * 0.38,
                        backgroundColor: activeButton === "Outward" ? "#17C6ED" : "white",
                        borderRadius: 8,
                        paddingVertical: 9,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "lightgray",
                    }}>

                    <Text
                        style={{
                            color: activeButton === "Outward" ? "white" : "black",
                            fontSize: 18,
                            fontWeight: "medium",
                        }}>

                        Outward
                    </Text>
                </TouchableOpacity>
            </View>
            <View className="h-9"></View>
            {/* First Row */}
            <View className="flex-row justify-between items-center px-5">
                {/* Total Revenue Card */}
                <View
                    className="bg-white rounded-lg p-4 shadow-xl"
                    style={{
                        width: width * 0.42,
                        height: height * 0.14,
                        shadowColor: "#000",
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 5,
                    }}>

                    <TouchableOpacity>
                        <Text className="text-base font-light text-gray-600 mb-1">Total Revenue</Text>
                        <Text className="text-xl font-bold text-gray-900 mb-1">$24,567</Text>
                        <Text className="text-lg text-green-500 font-medium">+15%</Text>
                    </TouchableOpacity>
                </View>

                {/* Total Orders Card */}
                <View
                    className="bg-white rounded-lg p-4 shadow-xl"
                    style={{
                        width: width * 0.42,
                        height: height * 0.14,
                        shadowColor: "#000",
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 5,
                    }}>

                    <TouchableOpacity>
                        <Text className="text-base font-light text-gray-600 mb-1">Total Orders</Text>
                        <Text className="text-xl font-bold text-gray-900 mb-1">$847</Text>
                        <Text className="text-lg text-green-500 font-medium">+8%</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="h-4"></View>

            {/* Second Row */}
            <View className="flex-row justify-between items-center px-5">
                {/* Current Stock Card */}
                <View
                    className="bg-white rounded-lg p-4 shadow-xl"
                    style={{
                        width: width * 0.42,
                        height: height * 0.14,
                        shadowColor: "#000",
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 5,
                    }}>

                    <TouchableOpacity>
                        <Text className="text-base font-light text-gray-600 mb-1">Current Stock</Text>
                        <Text className="text-xl font-bold text-gray-900 mb-1">12,450</Text>
                        <Text className="text-lg text-red-500 font-medium">-5%</Text>
                    </TouchableOpacity>
                </View>

                {/* Active Customers Card */}
                <View
                    className="bg-white rounded-lg p-4 shadow-xl"
                    style={{
                        width: width * 0.42,
                        height: height * 0.14,
                        shadowColor: "#000",
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 5,
                    }}>

                    <TouchableOpacity>
                        <Text className="text-base font-light text-gray-600 mb-1">Active Customers</Text>
                        <Text className="text-xl font-bold text-gray-900 mb-1">234</Text>
                        <Text className="text-lg text-green-500 font-medium">+12%</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View className="h-7"></View>

            {/* Order Statistics */}
            <View className="">
                <Text className="text-xl font-bold top-3 px-4">Order Statistics</Text>

                <View className="h-7"></View>

                <View className="flex-row justify-center items-center">
                    <PieChart
                        data={[
                            { name: "Completed", population: 70, color: "#4caf50", legendFontColor: "#7F7F7F", legendFontSize: 15 },
                            { name: "Pending", population: 30, color: "#ff9800", legendFontColor: "#7F7F7F", legendFontSize: 15 },
                            { name: "Cancelled", population: 20, color: "#f44336", legendFontColor: "#7F7F7F", legendFontSize: 15 },
                        ]}
                        width={Dimensions.get('window').width - 8}
                        height={220}
                        chartConfig={{
                            backgroundGradientFrom: 'white',
                            backgroundGradientTo: 'white',
                            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                        }}
                        accessor="population"
                        style={{ borderRadius: 16, backgroundColor: 'white' }}
                    />
                </View>
            </View>


            <View className="h-7"></View>

            <View className="bg-white rounded-xl"
                style={{
                    height: height * 0.15,
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 }, // Vertical offset for the shadow
                    elevation: 5,
                }}>
                <TouchableOpacity className="flex-row justify-between items-center px-4 top-3">
                    <Text className="text-xl font-bold ">Customer Insights</Text>
                    <Icon name="supervisor-account" color="#0CC0DF" size={width * 0.07} />
                </TouchableOpacity>

                <View className="flex-row justify-between items-center px-4 top-6">
                    <View>
                        <Text className="text-lg font-light">Active</Text>
                        <Text className="text-lg font-bold">1,247</Text>
                    </View>
                    <View>
                        <Text className="text-lg font-light">Top Buyers</Text>
                        <Text className="text-lg font-bold">247</Text>
                    </View>
                    <View>
                        <Text className="text-lg font-light">Frequency</Text>
                        <Text className="text-lg font-bold">5.2/w</Text>
                    </View>
                </View>
            </View>

            <View className="h-7"></View>

            {/* Transport Efficiency */}
            <View className="bg-white rounded-xl"
                style={{
                    height: height * 0.15,
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 }, // Vertical offset for the shadow
                    elevation: 5,
                }}>

                <View className="bg-white rounded-xl p-4"
                    style={{
                        shadowColor: "#000",
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 5,
                    }}>

                    <TouchableOpacity className="flex-row justify-between items-center">
                        <Text className="text-xl font-bold ">Transport Efficiency</Text>
                        <Icon name="access-time" color="#0CC0DF" size={width * 0.07} />
                    </TouchableOpacity>
                    <View className="h-7"></View>

                    {/* First Progress Bar - On-Time Delivery */}
                    <Text className="text-lg font-medium px-4">On-Time Delivery - 90%</Text>
                    <View className="h-2"></View>
                    <View className="px-4">
                        <Progress.Bar
                            progress={0.9} // 90%
                            width={width * 0.8}
                            height={12}
                            borderRadius={8}
                            color="#4CAF50" // Green Color
                            borderWidth={0}
                            unfilledColor="#E0E0E0"
                            animationType="spring"
                        />
                    </View>

                    {/* Spacing */}
                    <View className="h-6"></View>

                    {/* Second Progress Bar - Avg Time */}
                    <Text className="text-lg font-medium px-4">Avg Time - 30 min</Text>
                    <View className="h-2"></View>
                    <View className="px-4">
                        <Progress.Bar
                            progress={0.5} // Adjusted to a relative scale (e.g., 30 min in 1-hour scale)
                            width={width * 0.8}
                            height={12}
                            borderRadius={8}
                            color="#FFA500" // Orange Color
                            borderWidth={0}
                            unfilledColor="#E0E0E0"
                            animationType="spring"
                        />
                    </View>
                </View>
            </View>

            <View className="h-32"></View>
        </ScrollView>
    );
}

export default analytics