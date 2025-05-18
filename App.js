import React, { useState, useEffect } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import 'nativewind';
import getEnvVars from './config/environment';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './app/screens/LoginScreen'; // Import LoginScreen
import { AuthProvider, useAuth } from "./app/contexts/authContext";
import Homescreen from './app/screens/Homescreen';
import { Button } from 'react-native'; 
import Tabs from "./app/navigation/bottomNavigation";
import Invoicescreen from "./app/screens/Invoicescreen";
import InwardList from "./app/screens/Inward/InwardList";
import InwardDetail from "./app/screens/Inward/InwardDetail";
import AddInward from "./app/screens/Inward/addInward";
import OutwardList from "./app/screens/Outward/OutwardList";
import AddOutward from "./app/screens/Outward/addOutward";
import TransportList from "./app/screens/Transport/TransportList";
import addTransport from "./app/screens/Transport/addTransport";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import ProductList from "./app/screens/Products/productList";
import addProduct from "./app/screens/Products/addProduct";
import addCategory from "./app/screens/Category/addCategory";
import categoryList from "./app/screens/Category/categoryList";
import CategoryDetail from "./app/screens/Category/categoryDetail";
import updateCategory from "./app/screens/Category/updateCategory";
import addCustomer from "./app/screens/customers/addCustomer";
import CustomerDetail from "./app/screens/customers/CustomerDetail";

import CustomerList from "./app/screens/customers/CustomerList";
import addWarehouse from "./app/screens/Warehouse/addWarehouse";
import WarehouseList from "./app/screens/Warehouse/warehouseList";
import updateWarehouse from "./app/screens/Warehouse/updateWarehouse";
import updateProduct from "./app/screens/Products/updateProduct";
import UserList from "./app/screens/user/userList";
import updateUser from "./app/screens/user/updateUser";
import AddUser from "./app/screens/user/addUser";
import OutwardDetail from "./app/screens/Outward/OutwardDetail";
import OutwardUpdate from "./app/screens/Outward/updateOutward";
import analytics from "./app/screens/analytics";
import Invoice from "./app/screens/invoice";
import InwardUpdate from "./app/screens/Inward/updateInward";
import EditTransport from "./app/screens/Transport/updateTransport";
import TransactionDetailsScreen from "./app/screens/TransactionDetails";
import ProductDetails from "./app/screens/Products/productDetail";
import SupplierList from "./app/screens/Supplier/supplierList";
import AddSupplier from "./app/screens/Supplier/addSupplier";
import SupplierDetail from "./app/screens/Supplier/supplierDetails";
import EditProfile from "./app/screens/user/editPage";
import UpdateSupplier from "./app/screens/Supplier/UpdateSupplier";
import UpdateCustomer from "./app/screens/customers/updateCustomer";




const Stack = createStackNavigator();
// const navigation = useNavigation();

export default function App() {
1  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <AuthProvider>
          <NavigationContainer>
            <Layout />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export const Layout = () => {
  const { authState, onLogout } = useAuth(); 

  return (
    
      // <NavigationContainer>
      <Stack.Navigator>
        {authState?.authenticated ? (
         <>
          <Stack.Screen 
            name="Homescreen"
            component={Tabs} 
            options={{ 
              headerShown:false
              // headerRight: () => (
              //   <Button onPress={() => {
              //     console.log('Logout button pressed');
              //     onLogout();
              //   }} title="Logout" />
                
              //                 ),
            }} 
          />
          <Stack.Screen name="InwardListing" component={InwardList} options={{headerShown:false}} />
          <Stack.Screen name="InwardDetail" component={InwardDetail} options={{headerShown:false}} />
          <Stack.Screen name="AddInward" component={AddInward} options={{headerShown:false}} />
          <Stack.Screen name="OutwardListing" component={OutwardList} options={{headerShown:false}} />
          <Stack.Screen name="updateInward" component={InwardUpdate} options={{headerShown:false}} />
          {/* <Stack.Screen name="OutwardDetail" component={Outdetail} options={{headerShown:false}} /> */}
          <Stack.Screen name="AddOutward" component={AddOutward} options={{headerShown:false}} />
          <Stack.Screen name="OutwardDetail" component={OutwardDetail} options={{headerShown:false}} />
          <Stack.Screen name="OutwardUpdate" component={OutwardUpdate} options={{headerShown:false}} />
          {/* <Stack.Screen name="Invoicescreen" component={Invoicescreen} options={{headerShown:false}} /> */}

          {/* Transportation screens */}
          {/* <Stack.Screen name="TransportListing" component={TransportList} options={{headerShown:false}} />
          <Stack.Screen name="updateTransport" component={EditTransport} options={{headerShown:false}} />
          <Stack.Screen name="addTransport" component={addTransport} options={{headerShown:false}} /> */}

          {/* Supplier Screens */}
          <Stack.Screen name="SupplierListing" component={SupplierList} options={{headerShown:false}} />
          <Stack.Screen name="supplierDetail" component={SupplierDetail} options={{headerShown:false}} />
          <Stack.Screen name="addSupplier" component={AddSupplier} options={{headerShown:false}} />
          <Stack.Screen name="UpdateSupplier" component={UpdateSupplier} options={{headerShown:false}} />
          {/* Products screen */}
          <Stack.Screen name="ProductList" component={ProductList} options={{headerShown:false}} />
          <Stack.Screen name="addProduct" component={addProduct} options={{headerShown:false}} />
          <Stack.Screen name="updateProduct" component={updateProduct} options={{headerShown:false}} />
          <Stack.Screen name="ProductDetail" component={ProductDetails} options={{headerShown:false}} />
          {/* Category Screens */}
          <Stack.Screen name="addCategory" component={addCategory} options={{headerShown:false}} />  
          <Stack.Screen name="categoryList" component={categoryList} options={{headerShown:false}} />
          <Stack.Screen name="CategoryDetail" component={CategoryDetail} options={{headerShown:false}} />
          <Stack.Screen name="updateCategory" component={updateCategory} options={{headerShown:false}} />
          {/* Customers Screens */}
          <Stack.Screen name="CustomerList" component={CustomerList} options={{headerShown:false}} />
          <Stack.Screen name="addCustomer" component={addCustomer} options={{headerShown:false}} />
          <Stack.Screen name="CustomerDetail" component={CustomerDetail} options={{headerShown:false}} />
          <Stack.Screen name="UpdateCustomer" component={UpdateCustomer} options={{headerShown:false}} />

          {/* Warehouse screens */}
           <Stack.Screen name="warehouseList" component={WarehouseList} options={{headerShown:false}} />
          <Stack.Screen name="addWarehouse" component={addWarehouse} options={{headerShown:false}} /> 
          <Stack.Screen name="updateWarehouse" component={updateWarehouse} options={{headerShown:false}} />

          {/* Report Screen */}
          {/* <Stack.Screen name="analytics" component={analytics} options={{headerShown:false}}/> */}

          {/* Invoice Screen */}
          {/* <Stack.Screen name="InvoiceListing" component={Invoice} options={{headerShown:false}}/> */}

          {/* user */}
          <Stack.Screen name="userList" component={UserList} options={{headerShown:false}}/>
          <Stack.Screen name="updateUser" component={updateUser} options={{headerShown:false}}/>
          <Stack.Screen name="addUser" component={AddUser} options={{headerShown:false}}/>
          <Stack.Screen name="EditProfile" component={EditProfile} options={{headerShown:false}}/>


{/* Transaction details page */}

<Stack.Screen 
  name="TransactionDetails" 
  component={TransactionDetailsScreen}
  options={({ route }) => ({
    title: route.params.transactionType === 'inward' ? 'Inward Details' : 'Outward Details',
    headerBackTitle: 'Back'
  })}
/>

         </>
          
          
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{headerShown:false}} />
        )}
      </Stack.Navigator>
    // </NavigationContainer>
    
  );
}






//////////////////////////////////

// import React, { useState, useEffect } from "react";
// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';
// import 'nativewind';
// import getEnvVars from './config/environment';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import LoginScreen from './app/screens/LoginScreen'; // Import LoginScreen
// import { AuthProvider, useAuth } from "./app/contexts/authContext";
// import Homescreen from './app/screens/Homescreen';
// import { Button } from 'react-native'; 
// import Tabs from "./app/navigation/bottomNavigation";

// const Stack = createStackNavigator();

// export default function App() {
//   return (
//     <AuthProvider>
//       <Layout /> 
//     </AuthProvider>
//   );
// }

// export const Layout = () => {
//   const { authState, logout } = useAuth(); 

//   return (
//     <NavigationContainer>
//       <Stack.Navigator>
        
//           <Stack.Screen 
//             name="Homescreen" 
//             component={Homescreen} 
//             options={{ 
//               // headerRight: () => (
//               //   <Button onPress={logout} title="Logout" />
//               // ),
//               headerShown:false
//             }} 
//           />
        
//           <Stack.Screen name="Login" component={LoginScreen} />
//       <Tabs />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
// });