import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import MapView from "react-native-maps";
import React, { useState } from 'react';
import { useNavigation, useRoute } from "@react-navigation/native";
import { CalendarDaysIcon, MapPinIcon, BackwardIcon } from 'react-native-heroicons/solid'

export default function App() {
    const navigation = useNavigation();
    const route = useRoute();
    const { lat, long } = route.params;

    const onRegionChange = (region) => {
        console.log(region);
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                onRegionChange={onRegionChange}
                initialRegion={{
                    latitude: parseFloat(lat),
                    longitude: parseFloat(long),
                    latitudeDelta: 1,
                    longitudeDelta: 1,
                }}
            >
            </MapView>
            <TouchableOpacity style={[styles.button]} onPress={() => navigation.navigate('Home')}>
                <BackwardIcon size={28} color="white" />

            </TouchableOpacity>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignContent: 'center',
        justifyContent: 'center',
        flex: 1,
        justifyContent: "flex-start",
    },
    map: {
        width: '100%',
        height: '100%',
    },
    button: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    buttonText: {
        color: 'rgba(0,0,0,0.7)',
        textAlign: 'center',
    },
});
