import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from  '../screens/HomeScreen';
import MapView from  '../screens/MapView';
import { LogBox, Text, View } from "react-native";
import Swiper from 'react-native-screens-swiper';

const Stack = createNativeStackNavigator();

LogBox.ignoreLogs([

    'Non-serializable values were found in the navigation state'
]);

export default function AppNavigation() {
    return(
        <NavigationContainer>
            <Stack.Navigator >
                <Stack.Screen name="Home" options={{headerShown: false}} component={HomeScreen} />
                <Stack.Screen name="Map" options={{headerShown: false}} component={MapView} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}